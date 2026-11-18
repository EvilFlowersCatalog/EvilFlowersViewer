<script setup lang="ts">
// The viewer shell: composes the document loader, theme, shortcuts, text
// selection, telemetry and the host controller, and lays out the reading
// surface. The logic lives in composables (src/composables) and framework-free
// modules (src/core); see docs/architecture.md.
import { computed, nextTick, onBeforeUnmount, onErrorCaptured, onMounted, provide, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAssistantStore, useDocumentStore, useSearchStore, useViewerStore } from '@/stores';
import type { IViewerProps, VIEWER_ACTION } from '@/assets/utils/interfaces';
import { EDIT_TOOL, LAYER_STATE, MODAL_CONTENT, SIDEBAR_STATE } from '@/assets/utils/enums';
import { MOBILE_SIZE } from '@/assets/utils/constans';
import { ExplainPopup } from './pdf-viewer-page/pdf-selection';
import ChatPanel from './pdf-chat/ChatPanel.vue';
import { PageStream } from './pdf-viewer-page';
import FindBar from './pdf-viewer-page/pdf-search/FindBar.vue';
import { Loader } from './pdf-aids';
import ReaderTopBar from './pdf-viewer-page/ReaderTopBar.vue';
import Navigator from './pdf-viewer-page/pdf-navigator/Navigator.vue';
import { useEditRail } from './pdf-viewer-page/pdf-edit/pdf-edit-menu/useEditRail';
import { PDFEditMenu } from './pdf-viewer-page/pdf-edit/pdf-edit-menu';
import { closeTopLayer, useEscapeLayer } from './pdf-aids/useEscapeLayer';
import { useTheme } from '@/composables/useTheme';
import { useDocumentLoader } from '@/composables/useDocumentLoader';
import { useKeyboardShortcuts, type ShortcutMap } from '@/composables/useKeyboardShortcuts';
import { provideTextSelection } from '@/composables/useTextSelection';
import { provideAnnouncer } from '@/composables/useAnnouncer';
import { useViewerController } from '@/composables/useViewerController';
import { useEmbeddedMetadata } from '@/composables/useEmbeddedMetadata';
import { bridgeTelemetry } from '@/core/telemetry/bridge';
import { observeLongFrames } from '@/core/telemetry/longFrames';

const props = defineProps<IViewerProps>();
const { data, url, httpHeaders, withCredentials, rangeChunkSize, length, streaming, options, config } = props;

const viewerStore = useViewerStore();
const docStore = useDocumentStore();
const assistantStore = useAssistantStore();
const searchStore = useSearchStore();
const { t, locale } = useI18n({ useScope: 'global' });

// ---- host options: bound before anything reads them ----------------------------
viewerStore.bindOptions(options);
viewerStore.bindConfig(config);
const setLang = (lang: string) => {
  viewerStore.lang = lang;
  locale.value = lang;
};
setLang(viewerStore.lang);

// ---- composition -------------------------------------------------------------------
const theme = useTheme(options?.theme, (value) => viewerStore.events.emit('theme-change', { theme: value }));
const { isDark, viewerBg, topbarBg } = theme;
provide('topbarBg', topbarBg);
provide('viewerBg', viewerBg);
provide('isDark', isDark);

// Cards, popups and the lightbox teleport here: inside the scope root (so the
// scoped styles and dark mode apply) but outside every clipping container.
const floatLayer = ref<HTMLElement | null>(null);
provide('floatLayer', floatLayer);

const announcer = provideAnnouncer();
const selection = provideTextSelection();
const loader = useDocumentLoader(
  { data, url, httpHeaders, withCredentials, rangeChunkSize, length, streaming },
  { initialPage: options?.initialPage, initialFocus: options?.initialFocus },
  () => ({
    pdfAssetsUrl: options?.pdfAssetsUrl,
    pdfWorkerUrl: options?.pdfWorkerUrl,
    workerRendering: options?.workerRendering,
  })
);
const { failed, failReason, retry, documentKey } = loader;

const controller = useViewerController({ loader, theme, selection, setLang });
defineExpose({ controller });

// Reference managers (Zotero, Mendeley) can save the publication.
const { coins } = useEmbeddedMetadata(
  computed(() => viewerStore.basedCitation),
  () => viewerStore.citationMetadata
);

// ---- telemetry -----------------------------------------------------------------------
const stopBridge = bridgeTelemetry(viewerStore.events, viewerStore.telemetry);
const stopLongFrames =
  viewerStore.telemetry.enabled && options?.telemetry?.longFrames !== false
    ? observeLongFrames(viewerStore.telemetry, options?.telemetry?.longFrameThresholdMs)
    : () => {};

// ---- what the host and assistive tech hear about --------------------------------------
// Page changes, with why they changed. A new document reports its opening page
// as `initial` with no previous page.
watch(
  () => [docStore.activePage, docStore.pdf] as const,
  ([page, pdf], [oldPage, oldPdf]) => {
    if (!pdf) return;
    const cause = docStore.takeNavigationCause();
    const opened = pdf !== oldPdf;
    viewerStore.events.emit('page-change', {
      page,
      totalPages: docStore.totalPages,
      pageLabel: docStore.pageLabel(page),
      previousPage: opened ? null : oldPage,
      cause: opened ? 'initial' : cause,
      canGoBack: docStore.backStack.length > 0,
      canGoForward: docStore.forwardStack.length > 0,
    });
    // Scrolling announces the page the reader settles on, not every one passed.
    announcer.announce(
      t('announce-page', { page: docStore.pageLabel(page) ?? page, total: docStore.totalPages }),
      cause === 'scroll' ? 900 : 250
    );
  }
);
watch(
  () => [docStore.scale, docStore.fitToWidth] as const,
  ([scale, fitToWidth]) => viewerStore.events.emit('scale-change', { scale, fitToWidth })
);
watch(
  () => [docStore.sidebarState, docStore.actionPopover] as const,
  ([sidebar, card]) => {
    const panel =
      card ?? (Object.entries({ search: SIDEBAR_STATE.SEARCH, toc: SIDEBAR_STATE.TOC, pages: SIDEBAR_STATE.PAGES, highlights: SIDEBAR_STATE.HIGHLIGHTS }).find(
        ([, state]) => state === sidebar
      )?.[0] as 'search' | 'toc' | 'pages' | 'highlights' | undefined) ?? null;
    viewerStore.events.emit('panel-change', { panel });
  }
);
watch(
  () => searchStore.status,
  (status) => {
    if (status !== 'done') return;
    const total = searchStore.hits.length;
    announcer.announce(total ? t('announce-search', { n: total }) : t('announce-search-none'));
  }
);

// ---- error boundary ------------------------------------------------------------------
// A throw in any child (a page render, a popup) is logged and shown as a
// dismissible notice instead of blanking the whole viewer.
const renderError = ref(false);
onErrorCaptured((error, _instance, info) => {
  console.error(`Viewer component error (${info}):\n`, error);
  viewerStore.telemetry.record('ui.error', { info: String(info).slice(0, 60) }, { level: 'error' });
  renderError.value = true;
  return false;
});

// ---- layout ---------------------------------------------------------------------------
const rootRef = ref<HTMLElement | null>(null);
const topBarRef = ref<InstanceType<typeof ReaderTopBar> | null>(null);
const editRail = useEditRail();
// The Navigator sits beside the pages on wide screens (they reflow, so what it
// points to is never under it) and over them on narrow ones.
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1280);
const navigatorDocked = computed(() => !docStore.isMobile && viewportWidth.value >= 900);

const progressPercent = computed(() => {
  const p = docStore.downloadProgress;
  if (!p || !p.total) return null;
  return Math.min(100, Math.round((p.loaded / p.total) * 100));
});
// After the first paint, while pdf.js still fetches the rest (not with
// `streaming`, where nothing is prefetched by design).
const backgroundPercent = computed(() => {
  if (docStore.openStatus !== 'ready' || docStore.loadInfo.streaming) return null;
  const percent = progressPercent.value;
  return percent !== null && percent < 100 ? percent : null;
});
const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} kB`;

// The page "Back" returns to, shown as its printed label when the PDF has one.
const backTarget = computed(() => {
  const page = docStore.backStack[docStore.backStack.length - 1];
  return page === undefined ? null : (docStore.pageLabel(page) ?? String(page));
});
const streamErrorKey = computed(() =>
  docStore.streamError?.status === 401 || docStore.streamError?.status === 403 ? 'stream-error-auth' : 'stream-error'
);

// ---- keyboard ---------------------------------------------------------------------------
// Escape closes the top layer only (cards, popups, panel, in the order they
// opened), then drops a drawing tool. It never changes the page or leaves.
useEscapeLayer(
  () => docStore.modalContent !== MODAL_CONTENT.NULL,
  () => docStore.setModalContent(MODAL_CONTENT.NULL)
);
useEscapeLayer(
  () => docStore.sidebarState !== SIDEBAR_STATE.NULL,
  () => docStore.setSidebarState(SIDEBAR_STATE.NULL)
);

// Opens the search panel with its field focused and selected (Ctrl/Cmd+F
// twice re-selects).
const openSearchPanel = () => {
  docStore.sidebarState = SIDEBAR_STATE.SEARCH;
  nextTick(() => {
    const field = rootRef.value?.querySelector<HTMLInputElement>('input[name="search-pattern"]');
    field?.focus();
    field?.select();
  });
};

// Actions are reported where their state changes, so a button, a shortcut and
// the controller each report once (download and recommendations, which have
// no state, report in the top bar).
const reportAction = (action: VIEWER_ACTION) => viewerStore.events.emit('action', { action });
watch(
  () => docStore.actionPopover,
  (card) => card && reportAction(card)
);
watch(
  () => assistantStore.isChatOpen,
  (open) => open && reportAction('chat')
);
watch(
  () => docStore.drawMode,
  (on) => on && reportAction('draw')
);
watch(
  () => docStore.isFullscreenMode,
  (on) => on && reportAction('fullscreen')
);

const shortcuts = (): ShortcutMap => ({
  keys: {
    arrowleft: () => docStore.previousPage(),
    arrowright: () => docStore.nextPage(),
    // PageUp/PageDown and ↑/↓ scroll the page stream natively.
    home: () => docStore.goTo(1, 'step'),
    end: () => docStore.goTo(docStore.totalPages, 'step'),
    '-': () => docStore.zoomOut(),
    '+': () => docStore.zoomIn(),
    // One key per action, shown in each button's tooltip.
    f: openSearchPanel,
    t: () => docStore.setSidebarState(docStore.toc.length ? SIDEBAR_STATE.TOC : SIDEBAR_STATE.PAGES),
    c: () => viewerStore.citation && docStore.toggleAction('cite'),
    s: () => viewerStore.shareFunction && viewerStore.config.share && docStore.toggleAction('share'),
    p: () => viewerStore.printFunction && viewerStore.config.print && docStore.toggleAction('print'),
    i: () => docStore.toggleAction('info'),
    d: () => viewerStore.config.download && topBarRef.value?.download(),
    r: () => topBarRef.value?.toggleSuggestions(),
    a: () => {
      if (!viewerStore.chatPackage) return;
      if (assistantStore.isChatOpen) assistantStore.isChatOpen = false;
      else assistantStore.openChat();
    },
    e: () => viewerStore.config.edit && viewerStore.editPackage && docStore.setDrawMode(!docStore.drawMode),
  },
  // Ctrl/Cmd + F / + - 0: find and zoom the document, not the browser.
  mod: {
    f: openSearchPanel,
    '+': () => docStore.zoomIn(),
    '=': () => docStore.zoomIn(),
    '-': () => docStore.zoomOut(),
    '0': () => docStore.setScale(1),
  },
  // Alt+←/→ walk the jump history, as in a browser.
  alt: {
    arrowleft: () => docStore.goBack(),
    arrowright: () => docStore.goForward(),
  },
  find: (backwards) => searchStore.step(backwards ? -1 : 1),
  escape: () => {
    if (closeTopLayer()) return;
    if (docStore.editTool !== EDIT_TOOL.MOUSE) docStore.editTool = EDIT_TOOL.MOUSE;
  },
});
useKeyboardShortcuts(rootRef, shortcuts, () => viewerStore.keyboardShortcuts);

// ---- lifecycle ----------------------------------------------------------------------------
const onFullscreenChange = () => (docStore.isFullscreenMode = !!document.fullscreenElement);
const onResize = () => {
  viewportWidth.value = window.innerWidth;
  docStore.isMobile = window.innerWidth <= MOBILE_SIZE || window.innerHeight <= MOBILE_SIZE;
};

onMounted(() => {
  void loader.load();
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('fullscreenchange', onFullscreenChange);
});

// Props changed by a host that renders <PDFViewer> as a component.
watch(
  () => [props.data, props.url] as const,
  () =>
    loader.open({
      data: props.data,
      url: props.url,
      httpHeaders: props.httpHeaders,
      withCredentials: props.withCredentials,
      rangeChunkSize: props.rangeChunkSize,
      length: props.length,
      streaming: props.streaming,
    })
);

onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  loader.dispose();
  stopLongFrames();
  stopBridge();
  viewerStore.dispose();
});
</script>

<template>
  <!-- Scope root: design tokens, `dark` and the Tailwind `important` selector
       (tailwind.config.js) all hang off this element, so every utility below
       is `.efv-viewer .x` and can't be overridden by a host's same-named
       classes. -->
  <div ref="rootRef" class="efv-viewer" :class="{ dark: isDark }" :lang="viewerStore.lang">
    <!-- Screen-reader announcements (page, search results, copy, explain) -->
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">{{ announcer.message.value }}</div>
    <!-- COinS: the publication for Zotero's COinS translator -->
    <span v-if="coins" class="Z3988" :title="coins" hidden></span>

    <!-- Failed -->
    <div
      v-if="failed"
      class="flex flex-col gap-4 h-screen w-full justify-center items-center"
      :class="isDark ? 'text-white' : 'text-[#1A1A1A]'"
      :style="{ backgroundColor: viewerBg }"
      role="alert"
    >
      <span class="text-4xl uppercase font-extrabold font-serif text-center px-4">{{ $t('failed-load-pdf') }}</span>
      <span class="text-sm text-center max-w-[420px] px-4" :class="isDark ? 'text-white/70' : 'text-[#333]'">
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
      v-else-if="!docStore.pdf"
      class="flex flex-col gap-6 w-full h-screen justify-center items-center text-white"
      :style="{ backgroundColor: viewerBg }"
    >
      <div class="h-[100px] w-[100px]">
        <Loader :size="100" color="#0077CC" :label="$t('load')" />
      </div>
      <div v-if="docStore.downloadProgress && docStore.downloadProgress.loaded > 0" class="flex flex-col items-center gap-2 w-[240px]">
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
          <div class="h-full bg-[#0077CC] transition-[width] duration-150" :style="{ width: `${progressPercent}%` }"></div>
        </div>
        <span class="text-xs tabular-nums" :class="isDark ? 'text-white/70' : 'text-[#333]'">
          {{
            progressPercent !== null
              ? $t('load-progress', { percent: progressPercent })
              : $t('load-progress-bytes', { size: formatBytes(docStore.downloadProgress.loaded) })
          }}
        </span>
      </div>
      <div
        v-if="docStore.streamError"
        class="flex flex-col items-center gap-3 text-sm text-center px-4"
        :class="isDark ? 'text-white/80' : 'text-[#333]'"
        role="alert"
      >
        <span>{{ $t(streamErrorKey) }}</span>
        <button
          type="button"
          class="bg-[#0077cc] hover:bg-[#0066b3] text-[#f5f7fa] text-sm font-semibold rounded-[7px] px-4 py-1.5 transition-colors"
          @click="retry"
        >
          {{ $t('reconnect') }}
        </button>
      </div>
    </div>

    <!-- Reading -->
    <div
      v-else
      class="relative flex h-screen w-full overflow-hidden text-white"
      :style="{ backgroundColor: viewerBg }"
      role="region"
      :aria-label="$t('pdf-viewer')"
    >
      <!-- Error boundary notice -->
      <div
        v-if="renderError"
        class="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3 py-2 rounded-md shadow-lg text-xs"
        :class="isDark ? 'text-white/90' : 'text-[#333]'"
        :style="{ backgroundColor: topbarBg }"
        role="alert"
      >
        <span>{{ $t('render-error') }}</span>
        <button type="button" class="font-semibold text-[#0077cc] hover:underline" @click="renderError = false">
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
        <span>{{ $t(streamErrorKey) }}</span>
        <button type="button" class="font-semibold text-[#0077cc] hover:underline whitespace-nowrap" @click="retry">
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
        <div class="h-full bg-[#0077CC]/70 transition-[width] duration-300" :style="{ width: `${backgroundPercent}%` }"></div>
      </div>

      <!-- Drawing layer state -->
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
        <ReaderTopBar
          ref="topBarRef"
          :is-dark="isDark"
          @toggle-dark="theme.toggle(), reportAction('theme')"
          @open-search="openSearchPanel"
        />

        <div class="relative flex flex-1 min-h-0 overflow-hidden">
          <!-- Contents · Pages · Search · Notes (docked on wide screens) -->
          <Navigator :docked="navigatorDocked" />

          <main class="relative flex-1 min-w-0 overflow-hidden">
            <!-- Every page, one scroll; a new document gets fresh pages (`open()`) -->
            <PageStream v-if="docStore.pdf" :key="documentKey" />

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
                aria-keyshortcuts="Alt+ArrowLeft"
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
          </main>

          <!-- Drawing tools: only in drawing mode, in their own column -->
          <PDFEditMenu v-if="editRail.visible.value" />
        </div>
      </div>

      <!-- Reading chat, docked right (the page area shrinks) -->
      <ChatPanel v-if="viewerStore.chatPackage && assistantStore.isChatOpen" />

      <!-- Explain card: stays put while the reader explains on and goes back -->
      <ExplainPopup v-if="assistantStore.explainRequest" :request="assistantStore.explainRequest" />
    </div>
    <div ref="floatLayer" />
  </div>
</template>
