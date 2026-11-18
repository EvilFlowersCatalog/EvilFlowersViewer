<script setup lang="ts">
import {
  onBeforeUnmount,
  onErrorCaptured,
  onMounted,
  ref,
  computed,
  watch,
  provide,
  nextTick,
} from 'vue';
import {
  useAssistantStore,
  useDocumentStore,
  useSearchStore,
  useViewerStore,
} from '@/stores';
import { ExplainPopup } from './pdf-viewer-page/pdf-selection';
import ChatPanel from './pdf-chat/ChatPanel.vue';
import {
  GlobalWorkerOptions,
  getDocument,
} from 'pdfjs-dist/legacy/build/pdf.mjs';
// The minified worker: the library inlines it, so every consumer downloads it.
import PDFWorker from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type {
  DOCUMENT_SOURCE_KIND,
  IDocumentSource,
  IOutlineEntry,
  IPDFOutlineItem,
  ITOCItem,
  IViewerController,
  IViewerFocus,
  IViewerProps,
  IViewerState,
  LOAD_ERROR_REASON,
  VIEWER_PANEL,
} from '@/assets/utils/interfaces';
import {
  HttpStatusError,
  openRangeSource,
  type RefreshableRangeTransport,
} from '@/assets/utils/rangeTransport';
import { PageStream } from './pdf-viewer-page';
import FindBar from './pdf-viewer-page/pdf-search/FindBar.vue';
import type {
  DocumentInitParameters,
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
} from 'pdfjs-dist/types/src/display/api';
import { Loader } from './pdf-aids';
import {
  EDIT_TOOL,
  MODAL_CONTENT,
  SIDEBAR_STATE,
  LAYER_STATE,
} from '@/assets/utils/enums';
import { MOBILE_SIZE } from '@/assets/utils/constans';
import ReaderTopBar from './pdf-viewer-page/ReaderTopBar.vue';
import Navigator from './pdf-viewer-page/pdf-navigator/Navigator.vue';
import { useEditRail } from './pdf-viewer-page/pdf-edit/pdf-edit-menu/useEditRail';
import { PDFEditMenu } from './pdf-viewer-page/pdf-edit/pdf-edit-menu';
import i18n from '@/assets/lang/i18n';
import { closeTopLayer, useEscapeLayer } from './pdf-aids/useEscapeLayer';
GlobalWorkerOptions.workerSrc = PDFWorker;

const {
  data,
  url,
  httpHeaders,
  withCredentials,
  rangeChunkSize,
  length,
  streaming,
  options,
  config,
} = defineProps<IViewerProps>();

// The document on screen. Starts as the mount props; `controller.open()`
// replaces it without remounting (callbacks and config stay).
const source = ref<IDocumentSource>({
  data,
  url,
  httpHeaders,
  withCredentials,
  rangeChunkSize,
  length,
  streaming,
});
// Where to open the next load; the mount options for the first one.
let openAt: { initialPage?: number | null; initialFocus?: IViewerFocus | null } = {
  initialPage: options?.initialPage,
  initialFocus: options?.initialFocus,
};

// 512 KiB: a 7 MB book in ~14 Range requests instead of ~100 at pdf.js' 64 KiB.
const DEFAULT_RANGE_CHUNK = 512 * 1024;
const viewerStore = useViewerStore();
const docStore = useDocumentStore();
const assistantStore = useAssistantStore();
const searchStore = useSearchStore();
const failed = ref<boolean>(false);
// i18n key of the reason the document failed to load.
const failReason = ref<string>('load-error-unknown');
// Bytes received so far while the document loads (pdf.js onProgress).
const progress = ref<{ loaded: number; total: number } | null>(null);
// Set when a child component throws; the viewer keeps running and shows a notice.
const renderError = ref<boolean>(false);

// Theme precedence: the host's `options.theme`, else the reader's last manual
// choice (localStorage), else the system preference.
const THEME_KEY = 'efv-theme';
const readStoredTheme = (): 'dark' | 'light' | null => {
  try {
    const value = window.localStorage.getItem(THEME_KEY);
    return value === 'dark' || value === 'light' ? value : null;
  } catch {
    return null;
  }
};
const systemDark =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;
// The host's theme, `options.theme` at mount and `controller.setTheme` after.
let hostTheme: 'dark' | 'light' | null = options?.theme ?? null;
const resolveDark = () => {
  if (hostTheme) return hostTheme === 'dark';
  const stored = readStoredTheme();
  if (stored) return stored === 'dark';
  return systemDark?.matches ?? false;
};
const isDark = ref<boolean>(resolveDark());
// Kept in sync with the CSS design tokens in main.css (--efv-viewer-bg /
// --efv-topbar-bg) so the JS-provided values and the token theme never drift.
const viewerBg = computed(() => (isDark.value ? '#1A1A1A' : '#EDEDED'));
const topbarBg = computed(() => (isDark.value ? '#111111' : '#FFFFFF'));

const toggleDark = () => {
  isDark.value = !isDark.value;
  try {
    window.localStorage.setItem(THEME_KEY, isDark.value ? 'dark' : 'light');
  } catch {
    // Storage blocked (private mode, sandboxed iframe): the toggle still works.
  }
};

// Follow the system theme live, until the host or the reader picked one.
const handleSystemTheme = (event: MediaQueryListEvent) => {
  if (!hostTheme && !readStoredTheme()) isDark.value = event.matches;
};

provide('topbarBg', topbarBg);
provide('viewerBg', viewerBg);
provide('isDark', isDark);

// Cards, popups and the lightbox teleport here: inside the scope root (so the
// scoped styles and dark mode apply) but outside every clipping container.
const floatLayer = ref<HTMLElement | null>(null);
provide('floatLayer', floatLayer);

const getTOC = async (
  outline: IPDFOutlineItem[],
  level: number,
  pdf: PDFDocumentProxy
): Promise<ITOCItem[]> => {
  const toc: ITOCItem[] = [];

  for (let i = 0; i < outline.length; i++) {
    const item = outline[i];
    const title = item.title ?? 'Untitled';
    const children = item.items ? await getTOC(item.items, level + 1, pdf) : [];

    let pageNumber;
    try {
      if (item.dest) {
        if (typeof item.dest === 'string') {
          let ref: any;
          const dest = await pdf.getDestination(item.dest);
          if (dest) ref = dest[0];
          const index = await pdf.getPageIndex(ref);
          pageNumber = index + 1;
        } else {
          const index = await pdf.getPageIndex(item.dest[0]);
          pageNumber = index + 1;
        }
      } else {
        pageNumber = -1;
      }
    } catch (error) {
      pageNumber = -1;
    }

    toc.push({ title, pageNumber, level, children, isExpanded: false });
  }

  return toc;
};

// Set the active locale in a way that works in both Composition mode
// (locale is a WritableComputedRef) and Legacy mode (locale is a string).
// Kept out of loadDocument so a locale hiccup can never block PDF loading.
const applyLocale = (lang: string) => {
  const locale = i18n.global.locale as unknown;
  if (locale && typeof locale === 'object' && 'value' in (locale as object)) {
    (locale as { value: string }).value = lang;
  } else {
    (i18n.global as unknown as { locale: string }).locale = lang;
  }
};

const describeLoadError = (
  error: unknown
): { reason: LOAD_ERROR_REASON; status: number | null } => {
  const { name, message, details, status } = (error ?? {}) as {
    name?: string;
    message?: string;
    details?: string;
    status?: number;
  };
  const httpStatus = typeof status === 'number' && status > 0 ? status : null;
  if (name === 'PasswordException') return { reason: 'load-error-password', status: null };
  if (name === 'InvalidPDFException') return { reason: 'load-error-invalid', status: null };
  if (name === 'ResponseException' || name === 'HttpStatusError') {
    if (httpStatus === 401 || httpStatus === 403)
      return { reason: 'load-error-auth', status: httpStatus };
    if (httpStatus === 404 || httpStatus === 410)
      return { reason: 'load-error-not-found', status: httpStatus };
    return { reason: 'load-error-network', status: httpStatus };
  }
  // A failed fetch reaches us as a TypeError, or wrapped by the pdf.js worker
  // in an UnknownErrorException that keeps the original message.
  if (
    (name === 'TypeError' || name === 'UnknownErrorException') &&
    /fetch|network|load failed/i.test(`${message ?? ''} ${details ?? ''}`)
  )
    return { reason: 'load-error-network', status: null };
  return { reason: 'load-error-unknown', status: null };
};

// The task whose document is on screen, and the one still loading (if any).
// A load that is replaced before it opened is destroyed at once, so a quick
// book switch never leaves two downloads running.
let shownTask: PDFDocumentLoadingTask | null = null;
let pendingTask: PDFDocumentLoadingTask | null = null;
// Our own range transport of the loading/shown document (function headers).
let rangeTransport: RefreshableRangeTransport | null = null;
// Guards against a slow earlier load finishing after a newer one.
let loadSeq = 0;
// Streaming: the outline loads when the TOC panel first opens.
let stopOutlineWatch: (() => void) | null = null;
// The open document's outline, loaded once (by the TOC or `getOutline`).
let outlinePromise: Promise<ITOCItem[]> | null = null;
let ensureOutline: (() => Promise<ITOCItem[]>) | null = null;

const sourceKind = (src: IDocumentSource): DOCUMENT_SOURCE_KIND =>
  src.url
    ? typeof src.httpHeaders === 'function'
      ? 'range-transport'
      : 'url'
    : 'data';

// pdf.js resource folders the host serves (see IViewerOptions.pdfAssetsUrl).
const assetParams = (): Partial<DocumentInitParameters> => {
  const base = options?.pdfAssetsUrl;
  if (!base) return {};
  const root = base.endsWith('/') ? base : `${base}/`;
  return {
    wasmUrl: `${root}wasm/`,
    cMapUrl: `${root}cmaps/`,
    standardFontDataUrl: `${root}standard_fonts/`,
    iccUrl: `${root}iccs/`,
  };
};

// Pages are drawn in the renderer worker only when the host opts in. The
// worker script is a lazily imported chunk, so hosts that don't opt in never
// download it.
let rendererReady: Promise<boolean> | null = null;
const ensureRenderer = () =>
  (rendererReady ??= import('pdfjs-dist/legacy/build/pdf.renderer.min.mjs?url')
    .then(({ default: src }) => {
      GlobalWorkerOptions.rendererSrc = src;
      return true;
    })
    .catch((error) => {
      console.warn('Renderer worker unavailable, drawing on the main thread:\n', error);
      return false;
    }));

const commonParams = async (
  src: IDocumentSource
): Promise<Partial<DocumentInitParameters>> => {
  const useWorker = options?.workerRendering === true && (await ensureRenderer());
  return {
    ...assetParams(),
    // The viewer renders no forms or AnnotationLayer, so PDF JavaScript has no
    // way in (CVE-2026-16633 needs `enableScripting` in the AnnotationLayer);
    // XFA stays off as well.
    enableXfa: false,
    disableWorkerRendering: !useWorker,
    ...(src.url && src.streaming
      ? { disableAutoFetch: true, disableStream: true }
      : {}),
  };
};

const documentParams = async (
  src: IDocumentSource,
  seq: number
): Promise<{
  params: DocumentInitParameters | null;
  transport: RefreshableRangeTransport | null;
}> => {
  const common = await commonParams(src);
  const chunk = src.rangeChunkSize || DEFAULT_RANGE_CHUNK;
  if (src.url && typeof src.httpHeaders === 'function') {
    const opened = await openRangeSource({
      url: src.url,
      headers: src.httpHeaders,
      withCredentials: src.withCredentials ?? false,
      chunkSize: chunk,
      length: src.length,
      onError: (status) => {
        if (seq === loadSeq) docStore.reportStreamError(status);
      },
    });
    if (opened.kind === 'data')
      return { params: { ...common, data: opened.data }, transport: null };
    return {
      params: { ...common, range: opened.transport, rangeChunkSize: chunk },
      transport: opened.transport,
    };
  }
  if (src.url) {
    return {
      params: {
        ...common,
        url: src.url,
        httpHeaders: (src.httpHeaders as Record<string, string>) ?? undefined,
        withCredentials: src.withCredentials ?? false,
        rangeChunkSize: chunk,
      },
      transport: null,
    };
  }
  // Copy: pdf.js transfers the buffer to its worker, the host keeps its bytes.
  if (src.data)
    return { params: { ...common, data: new Uint8Array(src.data) }, transport: null };
  return { params: null, transport: null };
};

// One host progress call per frame at most.
let progressFrame = 0;
const reportProgress = (loaded: number, total: number) => {
  progress.value = { loaded, total };
  docStore.downloadProgress = { loaded, total };
  const cb = viewerStore.onLoadProgress;
  if (!cb || progressFrame) return;
  progressFrame = requestAnimationFrame(() => {
    progressFrame = 0;
    const p = docStore.downloadProgress;
    if (p) docStore.callHost(() => cb({ ...p }));
  });
};

const loadDocument = async () => {
  const seq = ++loadSeq;
  const src = source.value;
  failed.value = false;
  progress.value = null;
  docStore.startDocumentOpen({
    source: sourceKind(src),
    streaming: !!(src.url && src.streaming),
  });

  // A load that never opened is dropped right away (book switch mid-load).
  pendingTask?.destroy();
  pendingTask = null;

  try {
    const { params, transport } = await documentParams(src, seq);
    if (seq !== loadSeq) {
      transport?.abort(); // superseded while probing
      return;
    }
    if (!params) throw new Error('Neither `data` nor `url` was given.');

    const task = getDocument(params);
    pendingTask = task;
    // The latest load's transport; `retry` re-requests its failed ranges. The
    // previous document's transport is aborted by its task's destroy().
    rangeTransport = transport;
    if (transport) reportProgress(transport.initialData?.length ?? 0, transport.length);
    task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (seq === loadSeq) reportProgress(loaded, total);
    };

    // Parse the document once and share the single PDFDocumentProxy between the
    // main page view and the thumbnail strip. pdf.js serialises render tasks per
    // page internally, so concurrent main + preview renders are safe — this
    // halves both the parse work and the in-memory footprint vs. loading twice.
    const pdf = await task.promise;
    if (seq !== loadSeq) return;

    // The new document replaces the one on screen: only now is it safe to
    // destroy the old one (its pages were visible until this point).
    const previous = shownTask;
    shownTask = task;
    pendingTask = null;
    previous?.destroy();

    const totalBytes = docStore.downloadProgress?.total || null;
    const cbLoaded = viewerStore.onDocumentLoaded;
    if (cbLoaded)
      docStore.callHost(() =>
        cbLoaded({
          totalPages: pdf.numPages,
          ...docStore.loadInfo,
          totalBytes,
        })
      );

    // The host can open the document at a page, e.g. one a chat citation
    // pointed to. Read now, not at the start: `goToPage`/`focus` called while
    // the document loaded update it. Used once; a later reload starts at 1.
    const at = openAt;
    openAt = {};
    const focus = at.initialFocus;
    const initialPage = Math.trunc(Number(focus?.page || at.initialPage) || 1);
    searchStore.clear(); // results belong to the previous document
    docStore.totalPages = pdf.numPages;
    docStore.pageLabels = null;
    docStore.openAtPage(initialPage);
    docStore.toc = [];
    pdf
      .getPageLabels()
      .then((labels) => {
        // Labels that only repeat the physical numbers add nothing.
        const useful = labels?.some((label, i) => label !== String(i + 1));
        if (seq === loadSeq) docStore.pageLabels = useful ? labels : null;
      })
      .catch(() => undefined);
    docStore.previewPdf = pdf;
    docStore.pdf = pdf;

    // The outline resolves a destination per entry; with a streamed `url` that
    // can mean extra range requests, so it never holds back the first page.
    // With `streaming` it waits until the reader opens the table of contents:
    // resolving every entry walks most of the page tree.
    outlinePromise = null;
    const loadOutline = () =>
      (outlinePromise ??= pdf
        .getOutline()
        .then((outline) => (outline ? getTOC(outline, 0, pdf) : []))
        .then((toc) => {
          if (seq === loadSeq) docStore.toc = toc;
          return toc;
        })
        .catch((error) => {
          console.error('Failed to read the outline:\n', error);
          return [] as ITOCItem[];
        }));
    ensureOutline = loadOutline;
    if (docStore.loadInfo.streaming) {
      stopOutlineWatch?.();
      stopOutlineWatch = watch(
        () => docStore.sidebarState,
        (state) => {
          if (state !== SIDEBAR_STATE.TOC) return;
          stopOutlineWatch?.();
          stopOutlineWatch = null;
          if (seq === loadSeq) loadOutline();
        },
        { immediate: true }
      );
    } else {
      loadOutline();
    }

    // Bookmarks belong to the document, so they are (re)loaded with it. Not
    // awaited above: a slow/failing host must not delay the first paint.
    docStore.loadBookmarks();
    assistantStore.reset();
    assistantStore.loadAgentAnnotations();
    // ...and at a cited paragraph or figure: scrolled to, outlined, then faded.
    // Same page as the open, so this records no history.
    if (focus && (focus.bbox || focus.quads?.length || focus.regionId)) {
      assistantStore.focusOn({ ...focus, page: docStore.activePage }, 'initial');
    }
  } catch (error) {
    if (seq !== loadSeq) return;
    const { reason, status } = describeLoadError(error);
    failReason.value = reason;
    const fetchFailed =
      reason === 'load-error-network' ||
      reason === 'load-error-auth' ||
      reason === 'load-error-not-found' ||
      (!src.url && !src.data);
    docStore.reportDocumentError(fetchFailed ? 'download' : 'parse', reason, status);
    failed.value = true;
    pendingTask?.destroy();
    pendingTask = null;
    shownTask?.destroy();
    shownTask = null;
    docStore.pdf = null;
    docStore.previewPdf = null;
    console.error('Failed to load the PDF:\n', error);
  }
};

// After a failed open: load again. After a stream error: re-request the
// ranges that failed (pdf.js is still waiting for them); a `url` load without
// our transport cannot resume, so it reopens at the current page.
const retry = () => {
  if (docStore.streamError && rangeTransport && !failed.value) {
    docStore.streamError = null;
    rangeTransport.retryFailed();
    return;
  }
  if (docStore.streamError && docStore.pdf) {
    // pdf.js' own loader cannot resume a failed range: reopen where we were.
    openAt = { initialPage: docStore.activePage };
  }
  loadDocument();
};

const progressPercent = computed(() => {
  const p = progress.value;
  if (!p || !p.total) return null;
  return Math.min(100, Math.round((p.loaded / p.total) * 100));
});

// The Navigator sits beside the pages on wide screens (they reflow, so what
// it points to is never under it) and over them on narrow ones.
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
const navigatorDocked = computed(() => !docStore.isMobile && viewportWidth.value >= 900);
const topBarRef = ref<InstanceType<typeof ReaderTopBar> | null>(null);
const editRail = useEditRail();

// The page "Back" returns to, shown as its printed label when the PDF has one.
const backTarget = computed(() => {
  const page = docStore.backStack[docStore.backStack.length - 1];
  return page === undefined ? null : docStore.pageLabel(page) ?? String(page);
});

// After the first paint, while pdf.js still fetches the rest (not with
// `streaming`, where nothing is prefetched by design).
const backgroundPercent = computed(() => {
  if (docStore.openStatus !== 'ready' || docStore.loadInfo.streaming) return null;
  const percent = progressPercent.value;
  return percent !== null && percent < 100 ? percent : null;
});

const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} kB`;

// Error boundary: a throw in any child (a page render, a popup) is logged and
// shown as a dismissible notice instead of blanking the whole viewer.
onErrorCaptured((error, _instance, info) => {
  console.error(`Viewer component error (${info}):\n`, error);
  renderError.value = true;
  return false;
});

// Escape closes the top layer only (cards, popups, modal, sidebar panel, in
// the order they opened), then drops a drawing tool. It never zooms, changes
// the page or leaves the viewer.
useEscapeLayer(
  () => docStore.modalContent !== MODAL_CONTENT.NULL,
  () => docStore.setModalContent(MODAL_CONTENT.NULL)
);
useEscapeLayer(
  () => docStore.sidebarState !== SIDEBAR_STATE.NULL,
  () => docStore.setSidebarState(SIDEBAR_STATE.NULL)
);

// Opens the search panel with its field focused and selected, so a new query
// can be typed straight away (Ctrl/Cmd+F twice re-selects).
const rootRef = ref<HTMLElement | null>(null);
const openSearchPanel = () => {
  docStore.sidebarState = SIDEBAR_STATE.SEARCH;
  nextTick(() => {
    const field = rootRef.value?.querySelector<HTMLInputElement>(
      'input[name="search-pattern"]'
    );
    field?.focus();
    field?.select();
  });
};

const handleEscape = () => {
  if (closeTopLayer()) return;
  if (docStore.editTool !== EDIT_TOOL.MOUSE) docStore.editTool = EDIT_TOOL.MOUSE;
};

// Keys typed into a text field belong to the field, whatever it is and wherever
// it lives (host page included). Escape still reaches the viewer.
const isTypingTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  return (
    el.isContentEditable ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT'
  );
};

onMounted(() => {
  viewerStore.citation = options?.citationBib ?? null;
  viewerStore.basedCitation = options?.citationBib ?? null;
  viewerStore.closeFunction = options?.closeFunction ?? null;
  viewerStore.homeFunction = options?.homeFunction ?? null;
  viewerStore.editPackage = options?.editPackage ?? null;
  viewerStore.pageBookmarkPackage = options?.pageBookmarkPackage ?? null;
  viewerStore.lang = options?.lang ?? 'en';
  applyLocale(options?.lang ?? 'en');
  viewerStore.shareFunction = options?.shareFunction ?? null;
  viewerStore.printFunction = options?.printFunction ?? null;
  viewerStore.semanticSearchFunction = options?.semanticSearchFunction ?? null;
  viewerStore.openEntryDetailFunction = options?.openEntryDetailFunction ?? null;
  viewerStore.bookmarkToggleFunction = options?.bookmarkToggleFunction ?? null;
  viewerStore.suggestionsFunction = options?.suggestionsFunction ?? null;
  viewerStore.explainFunction = options?.explainFunction ?? null;
  viewerStore.chatPackage = options?.chatPackage ?? null;
  viewerStore.regionPackage = options?.regionPackage ?? null;
  viewerStore.agentAnnotationPackage = options?.agentAnnotationPackage ?? null;
  viewerStore.readerHighlightPackage = options?.readerHighlightPackage ?? null;
  viewerStore.onFirstPageRendered = options?.onFirstPageRendered ?? null;
  viewerStore.title = options?.title ?? null;
  viewerStore.onDocumentError = options?.onDocumentError ?? null;
  viewerStore.onDocumentLoaded = options?.onDocumentLoaded ?? null;
  viewerStore.onLoadProgress = options?.onLoadProgress ?? null;
  viewerStore.onPageChange = options?.onPageChange ?? null;
  viewerStore.onStreamError = options?.onStreamError ?? null;
  viewerStore.onSearch = options?.onSearch ?? null;
  viewerStore.onSearchResultSelect = options?.onSearchResultSelect ?? null;
  viewerStore.config = {
    download: false,
    share: false,
    print: false,
    edit: false,
    ...config,
  };

  loadDocument();

  const handleKeydown = async (event: KeyboardEvent) => {
    const key = event.key.toLocaleLowerCase();
    if (key !== 'escape' && isTypingTarget(event.target)) return;

    // Alt+←/→ walk the jump history (as in a browser), not the pages.
    if (event.altKey && (key === 'arrowleft' || key === 'arrowright')) {
      event.preventDefault();
      if (key === 'arrowleft') docStore.goBack();
      else docStore.goForward();
      return;
    }
    // Find, as in every PDF viewer: Ctrl/Cmd+F opens the search, F3 and
    // Ctrl/Cmd+G step through the hits (with Shift: backwards).
    const mod = event.ctrlKey || event.metaKey;
    if (mod && key === 'f') {
      event.preventDefault();
      openSearchPanel();
      return;
    }
    if (key === 'f3' || (mod && key === 'g')) {
      event.preventDefault();
      searchStore.step(event.shiftKey ? -1 : 1);
      return;
    }
    // Ctrl/Cmd + / - / 0 zoom the document, not the browser (as pdf.js does).
    if (mod && (key === '+' || key === '=' || key === '-' || key === '0')) {
      event.preventDefault();
      if (key === '-') docStore.zoomOut();
      else if (key === '0') docStore.setScale(1);
      else docStore.zoomIn();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;

    const keyActions: { [key: string]: (...props: any) => any } = {
      ['arrowleft']: () => docStore.previousPage(),
      ['arrowright']: () => docStore.nextPage(),
      // PageUp/PageDown and ↑/↓ scroll the page stream natively.
      ['home']: () => docStore.goTo(1, 'step'),
      ['end']: () => docStore.goTo(docStore.totalPages, 'step'),
      ['-']: () => docStore.zoomOut(),
      ['+']: () => docStore.zoomIn(),
      ['escape']: () => handleEscape(),
      // One key per action, shown in each button's tooltip.
      ['f']: () => openSearchPanel(),
      ['t']: () =>
        docStore.setSidebarState(docStore.toc.length ? SIDEBAR_STATE.TOC : SIDEBAR_STATE.PAGES),
      ['c']: () => viewerStore.citation && docStore.toggleAction('cite'),
      ['s']: () =>
        viewerStore.shareFunction && viewerStore.config.share && docStore.toggleAction('share'),
      ['p']: () =>
        viewerStore.printFunction && viewerStore.config.print && docStore.toggleAction('print'),
      ['i']: () => docStore.toggleAction('info'),
      ['d']: () => viewerStore.config.download && topBarRef.value?.download(),
      ['r']: () => topBarRef.value?.toggleSuggestions(),
      ['a']: () => {
        if (!viewerStore.chatPackage) return;
        if (assistantStore.isChatOpen) assistantStore.isChatOpen = false;
        else assistantStore.openChat();
      },
      ['e']: () =>
        viewerStore.config.edit &&
        viewerStore.editPackage &&
        docStore.setDrawMode(!docStore.drawMode),
    };

    const action = keyActions[key];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  const handleFullscreenChange = () => {
    docStore.isFullscreenMode = !!document.fullscreenElement;
  };

  const handleResize = () => {
    viewportWidth.value = window.innerWidth;
    docStore.isMobile =
      window.innerWidth <= MOBILE_SIZE || window.innerHeight <= MOBILE_SIZE;
  };

  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  systemDark?.addEventListener('change', handleSystemTheme);

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    systemDark?.removeEventListener('change', handleSystemTheme);
    if (progressFrame) cancelAnimationFrame(progressFrame);
    loadSeq++; // late results of an in-flight load are dropped
    pendingTask?.destroy();
    pendingTask = null;
    shownTask?.destroy();
    shownTask = null;
    rangeTransport = null;
    // The store may outlive this component (hot reload, a host remounting it):
    // never leave it pointing at a destroyed document.
    docStore.pdf = null;
    docStore.previewPdf = null;
    searchStore.clear();
  });

  // Props changed by a host that renders <PDFViewer> as a component.
  watch(
    () => [data, url],
    () => {
      source.value = {
        data,
        url,
        httpHeaders,
        withCredentials,
        rangeChunkSize,
        length,
        streaming,
      };
      openAt = {};
      loadDocument();
    }
  );
});

// Page changes for the host (reading position sync, deep links, analytics),
// with why the page changed. A new document reports its opening page as
// `initial` with no previous page.
watch(
  () => [docStore.activePage, docStore.pdf] as const,
  ([page, pdf], [oldPage, oldPdf]) => {
    if (!pdf) return;
    const cause = docStore.takeNavigationCause();
    const cb = viewerStore.onPageChange;
    if (!cb) return;
    const opened = pdf !== oldPdf;
    docStore.callHost(() =>
      cb({
        page,
        totalPages: docStore.totalPages,
        pageLabel: docStore.pageLabel(page),
        previousPage: opened ? null : oldPage,
        cause: opened ? 'initial' : cause,
        canGoBack: docStore.backStack.length > 0,
        canGoForward: docStore.forwardStack.length > 0,
      })
    );
  }
);

const PANELS: Record<VIEWER_PANEL, SIDEBAR_STATE> = {
  search: SIDEBAR_STATE.SEARCH,
  share: SIDEBAR_STATE.SHARE,
  info: SIDEBAR_STATE.INFO,
  print: SIDEBAR_STATE.PRINT,
  toc: SIDEBAR_STATE.TOC,
  pages: SIDEBAR_STATE.PAGES,
  highlights: SIDEBAR_STATE.HIGHLIGHTS,
};

// Outline items as the host sees them (no UI state).
const toOutline = (items: ITOCItem[]): IOutlineEntry[] =>
  items.map((item) => ({
    title: item.title,
    page: item.pageNumber > 0 ? item.pageNumber : null,
    level: item.level,
    children: toOutline(item.children),
  }));

const resolveDestination = async (name: string): Promise<number | null> => {
  const pdf = docStore.pdf;
  if (!pdf) return null;
  try {
    const dest = await pdf.getDestination(name);
    const target = dest?.[0];
    if (target == null) return null;
    const index =
      typeof target === 'number' ? target : await pdf.getPageIndex(target);
    return index + 1;
  } catch {
    return null;
  }
};

// The host's handle on the mounted viewer; `renderViewer` returns it as
// `app.viewer`. See IViewerController.
const controller: IViewerController = {
  open: (next, at = {}) => {
    source.value = { ...next };
    openAt = at;
    loadDocument();
  },
  retry,
  goToPage: (page) => {
    if (docStore.pdf) docStore.goTo(page, 'host');
    else openAt = { ...openAt, initialPage: page };
  },
  goToLabel: async (label) => {
    const page = docStore.pdf ? docStore.pageForLabel(label) : null;
    if (page) docStore.goTo(page, 'host');
    return page;
  },
  goToDestination: async (name) => {
    const page = await resolveDestination(name);
    if (page) docStore.goTo(page, 'host');
    return page;
  },
  nextPage: () => docStore.nextPage(),
  previousPage: () => docStore.previousPage(),
  back: () => docStore.goBack(),
  forward: () => docStore.goForward(),
  getOutline: async () => toOutline((await ensureOutline?.()) ?? []),
  focus: (target) => {
    if (!docStore.pdf) {
      openAt = { ...openAt, initialFocus: target };
      return;
    }
    assistantStore.focusOn(
      { ...target, page: target.page ?? docStore.activePage },
      'host'
    );
  },
  setScale: (scale) => docStore.setScale(scale),
  setTheme: (theme) => {
    hostTheme = theme;
    isDark.value = resolveDark();
  },
  setLang: (lang) => {
    viewerStore.lang = lang;
    applyLocale(lang);
  },
  // Share, Info and Print are cards under their buttons; the rest live in
  // the Navigator.
  openPanel: (panel) => {
    if (panel === 'share' || panel === 'info' || panel === 'print') {
      docStore.actionPopover = panel;
      return;
    }
    docStore.actionPopover = null;
    docStore.sidebarState = panel ? PANELS[panel] : SIDEBAR_STATE.NULL;
  },
  search: async (query, { openPanel = true, ...searchOptions } = {}) => {
    if (openPanel) docStore.sidebarState = SIDEBAR_STATE.SEARCH;
    // Related passages arrive on their own; the promise is the text search.
    if (viewerStore.semanticSearchFunction && query.trim().length >= 3)
      void searchStore.runSemantic(query);
    return searchStore.run(query, searchOptions);
  },
  searchNext: () => searchStore.step(1),
  searchPrevious: () => searchStore.step(-1),
  clearSearch: () => searchStore.clear(),
  showResults: async (results, { label = null, select = 0, openPanel = true } = {}) => {
    if (openPanel) docStore.sidebarState = SIDEBAR_STATE.SEARCH;
    return searchStore.showHostResults(results, label, select);
  },
  getState: (): IViewerState => ({
    page: docStore.activePage,
    totalPages: docStore.totalPages,
    pageLabel: docStore.pageLabel(docStore.activePage),
    canGoBack: docStore.backStack.length > 0,
    canGoForward: docStore.forwardStack.length > 0,
    scale: docStore.scale,
    theme: isDark.value ? 'dark' : 'light',
    lang: viewerStore.lang,
    status: failed.value ? 'failed' : docStore.openStatus,
    progress: docStore.downloadProgress ? { ...docStore.downloadProgress } : null,
    search: {
      query: searchStore.query,
      source: searchStore.source,
      total: searchStore.hits.length,
      active: searchStore.active,
    },
  }),
};

defineExpose({ controller });
</script>

<template>
  <!-- Scope root: design tokens, `dark` and the Tailwind `important` selector
       (tailwind.config.js) all hang off this element, so every utility below
       is `.efv-viewer .x` and can't be overridden by a host's same-named
       classes (e.g. the host's own `text-primary`). -->
  <div ref="rootRef" class="efv-viewer" :class="{ dark: isDark }" :lang="viewerStore.lang">
  <!-- Failed container -->
  <div
    v-if="failed"
    class="flex flex-col gap-4 h-screen w-full justify-center items-center"
    :class="isDark ? 'text-white' : 'text-[#1A1A1A]'"
    :style="{ backgroundColor: viewerBg }"
    role="alert"
  >
    <span class="text-4xl uppercase font-extrabold font-serif text-center px-4">
      {{ $t('failed-load-pdf') }}
    </span>
    <span
      class="text-sm text-center max-w-[420px] px-4"
      :class="isDark ? 'text-white/70' : 'text-[#333]'"
    >
      {{ $t(failReason) }}
    </span>
    <div class="flex flex-row gap-3">
      <button
        type="button"
        class="bg-[#0077cc] hover:bg-[#0066b3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0077cc] text-[#f5f7fa] text-sm font-semibold rounded-[7px] px-4 py-1.5 shadow-[0px_4px_6px_rgba(0,0,0,0.1)] transition-colors"
        @click="retry"
      >
        {{ $t('retry') }}
      </button>
      <button
        v-if="viewerStore.closeFunction"
        type="button"
        class="text-sm font-semibold rounded-[7px] px-4 py-1.5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0077cc]"
        :class="isDark ? 'text-white/80 hover:bg-white/10' : 'text-[#333] hover:bg-black/5'"
        @click="viewerStore.closeFunction?.()"
      >
        {{ $t('close') }}
      </button>
    </div>
  </div>

  <!-- Loading -->
  <div
    v-else-if="!failed && !docStore.pdf"
    class="flex flex-col gap-6 w-full h-screen justify-center items-center text-white"
    :style="{ backgroundColor: viewerBg }"
  >
    <div class="h-[100px] w-[100px]">
      <Loader :size="100" color="#0077CC" :label="$t('load')" />
    </div>
    <div
      v-if="progress && progress.loaded > 0"
      class="flex flex-col items-center gap-2 w-[240px]"
    >
      <div
        v-if="progressPercent !== null"
        class="w-full h-[6px] rounded-full overflow-hidden"
        :class="isDark ? 'bg-white/10' : 'bg-black/10'"
        role="progressbar"
        :aria-valuenow="progressPercent"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="$t('load')"
      >
        <div
          class="h-full bg-[#0077CC] transition-[width] duration-150"
          :style="{ width: `${progressPercent}%` }"
        ></div>
      </div>
      <span
        class="text-xs tabular-nums"
        :class="isDark ? 'text-white/70' : 'text-[#333]'"
      >
        {{
          progressPercent !== null
            ? $t('load-progress', { percent: progressPercent })
            : $t('load-progress-bytes', { size: formatBytes(progress.loaded) })
        }}
      </span>
    </div>
    <div
      v-if="docStore.streamError"
      class="flex flex-col items-center gap-3 text-sm text-center px-4"
      :class="isDark ? 'text-white/80' : 'text-[#333]'"
      role="alert"
    >
      <span>{{
        $t(
          docStore.streamError.status === 401 || docStore.streamError.status === 403
            ? 'stream-error-auth'
            : 'stream-error'
        )
      }}</span>
      <button
        type="button"
        class="bg-[#0077cc] hover:bg-[#0066b3] text-[#f5f7fa] text-sm font-semibold rounded-[7px] px-4 py-1.5 transition-colors"
        @click="retry"
      >
        {{ $t('reconnect') }}
      </button>
    </div>
  </div>

  <!-- Success container -->
  <div
    v-else
    class="relative flex h-screen w-full overflow-hidden text-white"
    :style="{ backgroundColor: viewerBg }"
    role="region"
    :aria-label="$t('pdf-viewer')"
  >
    <!-- Modal -->

    <!-- Error boundary notice -->
    <div
      v-if="renderError"
      class="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3 py-2 rounded-md shadow-lg text-xs"
      :class="isDark ? 'text-white/90' : 'text-[#333]'"
      :style="{ backgroundColor: topbarBg }"
      role="alert"
    >
      <span>{{ $t('render-error') }}</span>
      <button
        type="button"
        class="font-semibold text-[#0077cc] hover:underline"
        @click="renderError = false"
      >
        {{ $t('dismiss') }}
      </button>
    </div>

    <!-- A Range request failed after the document opened -->
    <div
      v-if="docStore.streamError"
      class="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3 py-2 rounded-md shadow-lg text-xs max-w-[calc(100%-32px)]"
      :class="isDark ? 'text-white/90' : 'text-[#333]'"
      :style="{ backgroundColor: topbarBg }"
      role="alert"
    >
      <span>{{
        $t(
          docStore.streamError.status === 401 || docStore.streamError.status === 403
            ? 'stream-error-auth'
            : 'stream-error'
        )
      }}</span>
      <button
        type="button"
        class="font-semibold text-[#0077cc] hover:underline whitespace-nowrap"
        @click="retry"
      >
        {{ $t('reconnect') }}
      </button>
    </div>

    <!-- Rest of the document still arriving in the background -->
    <div
      v-if="backgroundPercent !== null"
      class="absolute top-0 left-0 right-0 h-[2px] z-40 pointer-events-none"
      role="progressbar"
      :aria-valuenow="backgroundPercent"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-label="$t('background-download', { percent: backgroundPercent })"
      :title="$t('background-download', { percent: backgroundPercent })"
    >
      <div
        class="h-full bg-[#0077CC]/70 transition-[width] duration-300"
        :style="{ width: `${backgroundPercent}%` }"
      ></div>
    </div>

    <!-- Layer state indicator -->
    <div
      v-if="docStore.layerState !== LAYER_STATE.READY && docStore.layerState !== LAYER_STATE.NOT_READY && docStore.drawMode"
      class="absolute top-16 left-0 right-0 flex justify-center z-20 pointer-events-none select-none transition-opacity hover:opacity-30"
      role="status"
      aria-live="polite"
    >
      <div class="flex flex-row gap-2 items-center px-3 py-2 rounded-md shadow-lg" :style="{ backgroundColor: topbarBg }">
        <Loader :size="20" color="#0077CC" :label="$t(docStore.layerState)" />
        <span class="text-secondary text-xs font-medium">{{ $t(docStore.layerState) }}</span>
      </div>
    </div>

    <!-- Reading column: the bar, then the Navigator beside the pages -->
    <div class="relative flex flex-col flex-1 min-w-0 overflow-hidden" :style="{ backgroundColor: viewerBg }">
      <ReaderTopBar ref="topBarRef" :is-dark="isDark" @toggle-dark="toggleDark" @open-search="openSearchPanel" />

      <div class="relative flex flex-1 min-h-0 overflow-hidden">
        <!-- Contents · Pages · Search · Notes (docked on wide screens) -->
        <Navigator :docked="navigatorDocked" />

        <div class="relative flex-1 min-w-0 overflow-hidden">
          <!-- Every page, one scroll -->
          <PageStream v-if="docStore.pdf" />

          <!-- Find pill: step through search hits while the list is closed -->
          <FindBar />

          <!-- Return after a jump (link, contents, search, citation) -->
          <div
            v-if="backTarget !== null"
            class="absolute bottom-4 left-4 z-30 flex items-center rounded-full shadow-lg text-xs overflow-hidden"
            :class="isDark ? 'text-white/90' : 'text-[#333]'"
            :style="{ backgroundColor: topbarBg }"
          >
            <button
              type="button"
              class="flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 hover:bg-[#0077cc]/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0077cc]"
              :title="$t('back-shortcut')"
              @click="docStore.goBack()"
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path d="M8 5L3 10L8 15M3 10H17" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              {{ $t('back-to-page', { page: backTarget }) }}
            </button>
            <button
              type="button"
              class="px-2 py-1.5 border-l hover:bg-[#0077cc]/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0077cc]"
              :class="isDark ? 'border-white/10' : 'border-black/10'"
              :aria-label="$t('dismiss')"
              @click="docStore.clearHistory()"
            >
              <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Drawing tools: only in drawing mode, in their own column -->
        <PDFEditMenu v-if="editRail.visible.value" />
      </div>
    </div>

    <!-- Reading chat, docked right (the page area shrinks) -->
    <ChatPanel v-if="viewerStore.chatPackage && assistantStore.isChatOpen" />

    <!-- Draggable explain popup; keyed so a new request starts fresh -->
    <ExplainPopup
      v-if="assistantStore.explainRequest"
      :key="assistantStore.explainRequest.id"
      :request="assistantStore.explainRequest"
    />
  </div>
  <div ref="floatLayer" />
  </div>
</template>
