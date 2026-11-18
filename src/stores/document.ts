import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  EDIT_TOOL,
  MODAL_CONTENT,
  RENDER_STATE,
  SIDEBAR_STATE,
} from '@/assets/utils/enums';
import type {
  DOCUMENT_SOURCE_KIND,
  IDocumentErrorInfo,
  ILoadProgressInfo,
  IStreamErrorInfo,
  LOAD_ERROR_REASON,
  NAVIGATION_CAUSE,
  ITOCItem,
} from '@/assets/utils/interfaces';
import {
  DEFAULT_PAGE,
  MAX_SCALE,
  MIN_SCALE,
  MOBILE_SIZE,
  SCALE_STEP,
} from '@/assets/utils/constans';
import { useViewerStore } from './viewer';

/**
 * Per-instance document state. Refs are exposed directly (read + write) — see
 * the Pinia setup-store pattern; only operations that carry real logic (page
 * bounds, scale clamping, sidebar/modal toggling) are kept as
 * actions so the invariants live in one place.
 */
export const useDocumentStore = defineStore('document', () => {
  const pdf = ref<PDFDocumentProxy | null>(null);
  const previewPdf = ref<PDFDocumentProxy | null>(null);
  const activePage = ref<number>(DEFAULT_PAGE);
  const totalPages = ref<number>(DEFAULT_PAGE);
  const scale = ref<number>(1);
  const canvasWidth = ref<number>(0);
  const canvasHeight = ref<number>(0);
  const renderState = ref<RENDER_STATE>(RENDER_STATE.RENDERED);
  const isFullscreenMode = ref<boolean>(!!document.fullscreenElement);
  const sidebarState = ref<SIDEBAR_STATE>(SIDEBAR_STATE.NULL);
  const modalContent = ref<MODAL_CONTENT>(MODAL_CONTENT.NULL);
  // Floats above the bottom bar's "Odporúčania" button — separate from
  // sidebarState since it isn't a left-panel view.
  const isSuggestionsPopupOpen = ref<boolean>(false);
  const editTool = ref<EDIT_TOOL>(EDIT_TOOL.MOUSE);
  // The drawing tool picked last, taken up again on entering draw mode.
  let lastDrawTool: EDIT_TOOL = EDIT_TOOL.PEN;
  const toc = ref<ITOCItem[]>([]);
  const isMobile = ref<boolean>(
    window.innerWidth <= MOBILE_SIZE || window.innerHeight <= MOBILE_SIZE
  );
  // `edit`: saved drawings are shown (each page's ink layer is mounted).
  // `drawMode`: the drawing tools are out. Reading is the default; drawing
  // is a mode the reader enters on purpose.
  const edit = ref<boolean>(true);
  const drawMode = ref<boolean>(false);
  // Scale at which the page fills the view's width (set by the page stream),
  // for "Fit width" and the opening zoom.
  const fitWidthScale = ref<number>(1);
  // While fitted, the zoom follows the view's width (Navigator, chat and window
  // size change it) up to `fitCap`; any manual zoom ends that.
  const fitToWidth = ref<boolean>(false);
  // The action popover open under its top-bar button (cite, share, print,
  // info), so an action opens where it was asked for, not across the screen.
  const actionPopover = ref<'cite' | 'share' | 'print' | 'info' | null>(null);
  const toggleAction = (action: 'cite' | 'share' | 'print' | 'info') => {
    actionPopover.value = actionPopover.value === action ? null : action;
  };
  const fitCap = ref<number>(1.4);
  // Bookmarked pages → the host's record id for that bookmark (null when the
  // host issues none, or when nothing is persisting them). A Map keeps the
  // page-corner button and every thumbnail on one reactive source of truth.
  const bookmarks = ref<Map<number, string | null>>(new Map());
  // Pages with a bookmark call in flight, so double clicks can't race.
  const bookmarkPending = ref<Set<number>>(new Set());
  // How the open document was loaded, for the host's timing reports.
  const loadInfo = ref<{
    source: DOCUMENT_SOURCE_KIND;
    streaming: boolean;
  }>({ source: 'data', streaming: false });
  // Bytes received for the open document (null with `data` or before byte 1).
  const downloadProgress = ref<ILoadProgressInfo | null>(null);
  // Set when a Range request failed after the document opened; cleared on retry.
  const streamError = ref<IStreamErrorInfo | null>(null);
  // `ready` once the first page painted.
  const openStatus = ref<'loading' | 'ready' | 'failed'>('loading');
  // A request to bring a page into view (a jump). `seq` changes on every
  // request, so jumping to the page already on screen still scrolls to its top.
  const scrollRequest = ref<{ page: number; seq: number } | null>(null);
  let scrollSeq = 0;

  // Page is considered ready once its bitmap is painted (text layer is async
  // and must not block navigation/zoom).
  const isLoaded = () => renderState.value === RENDER_STATE.RENDERED;

  const clampScale = (val: number) =>
    val < MIN_SCALE ? MIN_SCALE : val > MAX_SCALE ? MAX_SCALE : val;

  // Manual zoom (buttons, keys, pinch, host): the reader's choice sticks.
  const setScale = (val: number) => {
    if (!isLoaded()) return;
    fitToWidth.value = false;
    scale.value = clampScale(val);
  };
  const zoomIn = () => setScale(scale.value + SCALE_STEP);
  const zoomOut = () => setScale(scale.value - SCALE_STEP);

  /** Fit the page to the view's width and keep following it, up to `cap`. */
  const fitWidth = (cap: number = MAX_SCALE) => {
    fitToWidth.value = true;
    fitCap.value = cap;
    scale.value = clampScale(Math.min(cap, Math.max(0.5, fitWidthScale.value)));
  };

  const setDrawMode = (on: boolean) => {
    drawMode.value = on;
    if (on) {
      // Draw mode opens with a tool in hand, the one used last.
      if (editTool.value === EDIT_TOOL.MOUSE) editTool.value = lastDrawTool;
    } else {
      if (editTool.value !== EDIT_TOOL.MOUSE) lastDrawTool = editTool.value;
      editTool.value = EDIT_TOOL.MOUSE; // back to reading
    }
  };

  // ---- Navigation -------------------------------------------------------
  // Every page change goes through goTo() with its cause, so jumps (a link,
  // the outline, a search hit, a citation, the host) are recorded in a
  // back/forward history while page turns are not, and the host learns why
  // the page changed.
  const JUMPS = new Set<NAVIGATION_CAUSE>([
    'link',
    'outline',
    'search',
    'citation',
    'host',
  ]);
  const MAX_HISTORY = 50;
  const backStack = ref<number[]>([]);
  const forwardStack = ref<number[]>([]);
  // Cause of the latest change, read once by the page-change reporter.
  let pendingCause: NAVIGATION_CAUSE = 'initial';
  // Cause of the latest jump into the current page; stepping from hit to hit
  // of one search records a single history entry (back = before the search).
  let arrivedBy: NAVIGATION_CAUSE = 'initial';
  // PDF page labels ("i", "ii", "1"…); null when the document defines none.
  const pageLabels = ref<string[] | null>(null);

  const clampPage = (page: number) =>
    Math.min(Math.max(1, Math.trunc(Number(page)) || 1), totalPages.value || 1);

  const requestScroll = (page: number) => {
    scrollRequest.value = { page, seq: ++scrollSeq };
  };

  const goTo = (page: number, cause: NAVIGATION_CAUSE = 'host') => {
    const target = clampPage(page);
    // Always bring the page into view: in the continuous view the target may
    // already be the active page, scrolled halfway down.
    requestScroll(target);
    if (target === activePage.value) return;
    const chained = cause === 'search' && arrivedBy === 'search';
    if (JUMPS.has(cause) && !chained) {
      backStack.value.push(activePage.value);
      if (backStack.value.length > MAX_HISTORY) backStack.value.shift();
      forwardStack.value = [];
    }
    pendingCause = cause;
    arrivedBy = cause;
    activePage.value = target;
  };

  const goBack = () => {
    const page = backStack.value.pop();
    if (page === undefined) return;
    forwardStack.value.push(activePage.value);
    pendingCause = arrivedBy = 'history';
    activePage.value = clampPage(page);
    requestScroll(activePage.value);
  };

  const goForward = () => {
    const page = forwardStack.value.pop();
    if (page === undefined) return;
    backStack.value.push(activePage.value);
    pendingCause = arrivedBy = 'history';
    activePage.value = clampPage(page);
    requestScroll(activePage.value);
  };

  /**
   * The continuous view reports the page the reader scrolled to: no history,
   * no scroll request. Drawing does not depend on it (every page has its own
   * ink layer), so it is reported with a tool in hand too.
   */
  const setActiveFromScroll = (page: number) => {
    const target = clampPage(page);
    if (target === activePage.value) return;
    pendingCause = arrivedBy = 'scroll';
    activePage.value = target;
  };

  const clearHistory = () => {
    backStack.value = [];
    forwardStack.value = [];
  };

  /** The cause of the latest page change; resets to `step`. */
  const takeNavigationCause = (): NAVIGATION_CAUSE => {
    const cause = pendingCause;
    pendingCause = 'step';
    return cause;
  };

  /** Starts a document at `page` without recording history. */
  const openAtPage = (page: number) => {
    clearHistory();
    pendingCause = arrivedBy = 'initial';
    activePage.value = clampPage(page);
    requestScroll(activePage.value);
  };

  const pageLabel = (page: number) => pageLabels.value?.[page - 1] ?? null;

  /** 1-based page whose label is `label` (case-insensitive), or null. */
  const pageForLabel = (label: string) => {
    const wanted = label.trim().toLowerCase();
    const index = pageLabels.value?.findIndex((l) => l.toLowerCase() === wanted) ?? -1;
    return index >= 0 ? index + 1 : null;
  };

  const nextPage = () => goTo(activePage.value + 1, 'step');
  const previousPage = () => goTo(activePage.value - 1, 'step');

  // Sidebar/modal are single-slot: selecting the open item closes it.
  const setSidebarState = (val: SIDEBAR_STATE) => {
    sidebarState.value =
      sidebarState.value === val ? SIDEBAR_STATE.NULL : val;
  };
  const setModalContent = (val: MODAL_CONTENT) => {
    modalContent.value = modalContent.value === val ? MODAL_CONTENT.NULL : val;
  };

  const isBookmarked = (page: number) => bookmarks.value.has(page);

  // Replaces the whole set from the host. Called once per document, so a
  // document swap always starts from a clean slate even if the host has no
  // bookmark package attached.
  const loadBookmarks = async () => {
    bookmarks.value = new Map();
    const pkg = useViewerStore().pageBookmarkPackage;
    if (!pkg) return;

    try {
      const saved = await pkg.getBookmarksFunc();
      bookmarks.value = new Map(saved.map((b) => [b.page, b.id ?? null]));
    } catch (error) {
      console.error('Failed to load page bookmarks:\n', error);
    }
  };

  // Optimistic: the button and the thumbnail flip immediately and roll back if
  // the host call fails, so the UI never waits on the network.
  const toggleBookmark = async (page: number) => {
    if (bookmarkPending.value.has(page)) return;

    const wasBookmarked = bookmarks.value.has(page);
    const previousId = bookmarks.value.get(page) ?? null;

    if (wasBookmarked) bookmarks.value.delete(page);
    else bookmarks.value.set(page, null);

    const pkg = useViewerStore().pageBookmarkPackage;
    if (!pkg) return;

    bookmarkPending.value.add(page);
    try {
      if (wasBookmarked) {
        await pkg.removeBookmarkFunc(page, previousId);
      } else {
        const saved = await pkg.addBookmarkFunc(page);
        // Keep the id only if the page is still bookmarked — the user may have
        // toggled it off again while the request was in flight.
        if (bookmarks.value.has(page))
          bookmarks.value.set(page, saved?.id ?? null);
      }
    } catch (error) {
      console.error('Failed to persist page bookmark:\n', error);
      if (wasBookmarked) bookmarks.value.set(page, previousId);
      else bookmarks.value.delete(page);
    } finally {
      bookmarkPending.value.delete(page);
    }
  };

  // Timing of one document open: started by the load, ended by the first
  // painted page or the first failure, whichever comes first. Each is reported
  // once; later page renders and errors are not.
  let openStartedAt: number | null = null;
  const events = () => useViewerStore().events;

  const startDocumentOpen = (info: {
    source: DOCUMENT_SOURCE_KIND;
    streaming: boolean;
  }) => {
    openStartedAt = performance.now();
    loadInfo.value = info;
    downloadProgress.value = null;
    streamError.value = null;
    openStatus.value = 'loading';
    events().emit('document-open', { ...info });
  };

  const reportFirstPaint = (page: number) => {
    if (openStartedAt === null) return;
    const durationMs = Math.round(performance.now() - openStartedAt);
    openStartedAt = null;
    openStatus.value = 'ready';
    const progress = downloadProgress.value;
    events().emit('first-page-rendered', {
      page,
      durationMs,
      ...loadInfo.value,
      bytesLoaded: progress?.loaded ?? null,
      totalBytes: progress?.total || null,
    });
  };

  const reportDocumentError = (
    stage: IDocumentErrorInfo['stage'],
    reason: LOAD_ERROR_REASON = 'load-error-unknown',
    status: number | null = null
  ) => {
    if (openStartedAt === null) return;
    openStartedAt = null;
    openStatus.value = 'failed';
    events().emit('document-error', { stage, reason, status, source: loadInfo.value.source });
  };

  const reportStreamError = (status: number | null) => {
    // One notice per outage: further failing ranges join the first.
    if (streamError.value) return;
    streamError.value = { status };
    events().emit('stream-error', { status });
  };

  return {
    // state
    pdf,
    previewPdf,
    activePage,
    totalPages,
    scale,
    canvasWidth,
    canvasHeight,
    renderState,
    isFullscreenMode,
    sidebarState,
    modalContent,
    isSuggestionsPopupOpen,
    editTool,
    toc,
    isMobile,
    edit,
    drawMode,
    fitWidthScale,
    fitToWidth,
    fitCap,
    fitWidth,
    actionPopover,
    toggleAction,
    bookmarks,
    bookmarkPending,
    loadInfo,
    downloadProgress,
    streamError,
    openStatus,
    backStack,
    forwardStack,
    pageLabels,
    scrollRequest,
    // actions
    setActiveFromScroll,
    setDrawMode,
    goTo,
    goBack,
    goForward,
    clearHistory,
    takeNavigationCause,
    openAtPage,
    pageLabel,
    pageForLabel,
    reportStreamError,
    isLoaded,
    setScale,
    zoomIn,
    zoomOut,
    nextPage,
    previousPage,
    setSidebarState,
    setModalContent,
    isBookmarked,
    loadBookmarks,
    toggleBookmark,
    startDocumentOpen,
    reportFirstPaint,
    reportDocumentError,
  };
});
