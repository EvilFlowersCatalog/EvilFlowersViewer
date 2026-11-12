<script setup lang="ts">
import {
  onBeforeUnmount,
  onErrorCaptured,
  onMounted,
  ref,
  computed,
  watch,
  provide,
} from 'vue';
import { useAssistantStore, useDocumentStore, useViewerStore } from '@/stores';
import { ExplainPopup } from './pdf-viewer-page/pdf-selection';
import ChatPanel from './pdf-chat/ChatPanel.vue';
import {
  GlobalWorkerOptions,
  getDocument,
} from 'pdfjs-dist/legacy/build/pdf.mjs';
import PDFWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';
import type {
  IPDFOutlineItem,
  ITOCItem,
  IViewerProps,
} from '@/assets/utils/interfaces';
import { PDFPage } from './pdf-viewer-page';
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
import { PDFBottomBar } from './pdf-viewer-page/pdf-bottom-bar';
import { PDFEditMenu } from './pdf-viewer-page/pdf-edit/pdf-edit-menu';
import { PDFModal } from './pdf-viewer-page/pdf-modal';
import { PDFMenuSidebar } from './pdf-viewer-page/pdf-menu/pdf-menu-sidebar';
import { PDFMenu } from './pdf-viewer-page/pdf-menu';
import i18n from '@/assets/lang/i18n';
import { closeTopLayer, useEscapeLayer } from './pdf-aids/useEscapeLayer';
GlobalWorkerOptions.workerSrc = PDFWorker;

const {
  data,
  url,
  httpHeaders,
  withCredentials,
  rangeChunkSize,
  options,
  config,
} = defineProps<IViewerProps>();
const viewerStore = useViewerStore();
const docStore = useDocumentStore();
const assistantStore = useAssistantStore();
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
const initialDark = () => {
  if (options?.theme) return options.theme === 'dark';
  const stored = readStoredTheme();
  if (stored) return stored === 'dark';
  return systemDark?.matches ?? false;
};
const isDark = ref<boolean>(initialDark());
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
  if (!options?.theme && !readStoredTheme()) isDark.value = event.matches;
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

const describeLoadError = (error: unknown): string => {
  const { name, message, details } = (error ?? {}) as {
    name?: string;
    message?: string;
    details?: string;
  };
  if (name === 'PasswordException') return 'load-error-password';
  if (name === 'InvalidPDFException') return 'load-error-invalid';
  if (name === 'ResponseException') return 'load-error-network';
  // A failed fetch reaches us as a TypeError, or wrapped by the pdf.js worker
  // in an UnknownErrorException that keeps the original message.
  if (
    (name === 'TypeError' || name === 'UnknownErrorException') &&
    /fetch|network|load failed/i.test(`${message ?? ''} ${details ?? ''}`)
  )
    return 'load-error-network';
  return 'load-error-unknown';
};

// The loading task of the document on screen, destroyed when another replaces it.
let loadingTask: PDFDocumentLoadingTask | null = null;
// Guards against a slow earlier load finishing after a newer one.
let loadSeq = 0;

const documentParams = (): DocumentInitParameters | null => {
  if (url) {
    return {
      url,
      httpHeaders: httpHeaders ?? undefined,
      withCredentials: withCredentials ?? false,
      ...(rangeChunkSize ? { rangeChunkSize } : {}),
    };
  }
  // Copy: pdf.js transfers the buffer to its worker, the host keeps its bytes.
  if (data) return { data: new Uint8Array(data) };
  return null;
};

const loadDocument = async () => {
  const seq = ++loadSeq;
  const previousTask = loadingTask;
  failed.value = false;
  progress.value = null;

  try {
    const params = documentParams();
    if (!params) throw new Error('Neither `data` nor `url` was given.');

    const task = getDocument(params);
    loadingTask = task;
    task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
      if (seq === loadSeq) progress.value = { loaded, total };
    };

    // Parse the document once and share the single PDFDocumentProxy between the
    // main page view and the thumbnail strip. pdf.js serialises render tasks per
    // page internally, so concurrent main + preview renders are safe — this
    // halves both the parse work and the in-memory footprint vs. loading twice.
    const pdf = await task.promise;
    if (seq !== loadSeq) return;

    // The host can open the document at a page, e.g. one a chat citation pointed to.
    const initialPage = Math.trunc(Number(options?.initialPage) || 1);
    docStore.totalPages = pdf.numPages;
    docStore.activePage = Math.min(Math.max(1, initialPage), pdf.numPages);
    docStore.toc = [];
    docStore.previewPdf = pdf;
    docStore.pdf = pdf;

    // The outline resolves a destination per entry; with a streamed `url` that
    // can mean extra range requests, so it never holds back the first page.
    pdf
      .getOutline()
      .then((outline) => (outline ? getTOC(outline, 0, pdf) : []))
      .then((toc) => {
        if (seq === loadSeq) docStore.toc = toc;
      })
      .catch((error) => console.error('Failed to read the outline:\n', error));

    // Bookmarks belong to the document, so they are (re)loaded with it. Not
    // awaited above: a slow/failing host must not delay the first paint.
    docStore.loadBookmarks();
    assistantStore.reset();
    assistantStore.loadAgentAnnotations();
  } catch (error) {
    if (seq !== loadSeq) return;
    failReason.value = describeLoadError(error);
    failed.value = true;
    docStore.pdf = null;
    docStore.previewPdf = null;
    console.error('Failed to load PDF docStore:\n', error);
  } finally {
    if (seq === loadSeq && previousTask && previousTask !== loadingTask) {
      previousTask.destroy();
    }
  }
};

const retry = () => loadDocument();

const progressPercent = computed(() => {
  const p = progress.value;
  if (!p || !p.total) return null;
  return Math.min(100, Math.round((p.loaded / p.total) * 100));
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

    const keyActions: { [key: string]: (...props: any) => any } = {
      ['arrowleft']: () => docStore.previousPage(),
      ['arrowright']: () => docStore.nextPage(),
      ['-']: () => docStore.zoomOut(),
      ['+']: () => docStore.zoomIn(),
      ['escape']: () => handleEscape(),
      ['f']: () => docStore.setSidebarState(SIDEBAR_STATE.SEARCH),
      ['s']: () => docStore.setSidebarState(SIDEBAR_STATE.SHARE),
      ['i']: () => docStore.setSidebarState(SIDEBAR_STATE.INFO),
      ['t']: () => docStore.setSidebarState(SIDEBAR_STATE.TOC),
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
    loadingTask?.destroy();
    loadingTask = null;
  });

  watch(
    () => [data, url],
    () => loadDocument()
  );
});
</script>

<template>
  <!-- Scope root: design tokens, `dark` and the Tailwind `important` selector
       (tailwind.config.js) all hang off this element, so every utility below
       is `.efv-viewer .x` and can't be overridden by a host's same-named
       classes (e.g. the host's own `text-primary`). -->
  <div class="efv-viewer" :class="{ dark: isDark }" :lang="viewerStore.lang">
  <!-- Failed container -->
  <div
    v-if="failed"
    class="flex flex-col gap-4 h-screen w-full justify-center items-center text-white"
    :style="{ backgroundColor: viewerBg }"
    role="alert"
  >
    <span class="text-4xl uppercase font-extrabold font-serif text-center px-4">
      {{ $t('failed-load-pdf') }}
    </span>
    <span class="text-sm" :class="isDark ? 'text-white/70' : 'text-[#333]'">
      {{ $t(failReason) }}
    </span>
    <button
      type="button"
      class="bg-[#0077cc] hover:bg-[#0066b3] text-[#f5f7fa] text-sm font-semibold rounded-[7px] px-4 py-1.5 shadow-[0px_4px_6px_rgba(0,0,0,0.1)] transition-colors"
      @click="retry"
    >
      {{ $t('retry') }}
    </button>
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
    <PDFModal v-if="docStore.modalContent !== MODAL_CONTENT.NULL" />

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

    <!-- Layer state indicator -->
    <div
      v-if="docStore.layerState !== LAYER_STATE.READY && docStore.layerState !== LAYER_STATE.NOT_READY && docStore.edit"
      class="fixed top-4 left-14 w-full flex justify-center z-20 pointer-events-none select-none transition-opacity hover:opacity-30"
      role="status"
      aria-live="polite"
    >
      <div class="flex flex-row gap-2 items-center px-3 py-2 rounded-md shadow-lg" :style="{ backgroundColor: topbarBg }">
        <Loader :size="20" color="#0077CC" :label="$t(docStore.layerState)" />
        <span class="text-secondary text-xs font-medium">{{ $t(docStore.layerState) }}</span>
      </div>
    </div>

    <!-- Left nav -->
    <PDFMenu :is-dark="isDark" :topbar-bg="topbarBg" @toggle-dark="toggleDark" />

    <!-- Content column -->
    <div class="relative flex flex-col flex-1 overflow-hidden" :style="{ backgroundColor: viewerBg }">
      <!-- Page area: floating sidebar panel is scoped to here so it never reaches the bottom bar -->
      <div class="relative flex flex-1 overflow-hidden">
        <div class="relative flex-1 overflow-hidden">
          <!-- PDF page -->
          <PDFPage v-if="docStore.pdf" />

          <!-- Floating sidebar panel (Search, Share, Info, Print, TOC, ...) -->
          <PDFMenuSidebar />
        </div>

        <!-- Drawing tools: docked rail, takes its own column -->
        <PDFEditMenu
          v-if="
            viewerStore.config.edit &&
            viewerStore.editPackage &&
            !docStore.isMobile &&
            docStore.edit
          "
        />
      </div>

      <!-- Bottom bar -->
      <PDFBottomBar />
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
