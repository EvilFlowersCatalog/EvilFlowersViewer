<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch, provide } from 'vue';
import { useDocumentStore, useViewerStore } from '@/stores';
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
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
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
GlobalWorkerOptions.workerSrc = PDFWorker;

const { data, options, config } = defineProps<IViewerProps>();
const viewerStore = useViewerStore();
const docStore = useDocumentStore();
const failed = ref<boolean>(false);
// Honor the host-provided theme; default to light (the Figma source of truth).
const isDark = ref<boolean>(options?.theme === 'dark');
// Kept in sync with the CSS design tokens in main.css (--efv-viewer-bg /
// --efv-topbar-bg) so the JS-provided values and the token theme never drift.
const viewerBg = computed(() => (isDark.value ? '#1A1A1A' : '#EDEDED'));
const topbarBg = computed(() => (isDark.value ? '#111111' : '#FFFFFF'));

const toggleDark = () => {
  isDark.value = !isDark.value;
};

provide('topbarBg', topbarBg);
provide('viewerBg', viewerBg);
provide('isDark', isDark);

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

const loadDocument = async () => {
  try {
    // Parse the document once and share the single PDFDocumentProxy between the
    // main page view and the thumbnail strip. pdf.js serialises render tasks per
    // page internally, so concurrent main + preview renders are safe — this
    // halves both the parse work and the in-memory footprint vs. loading twice.
    const pdf = await getDocument({ data: new Uint8Array(data) }).promise;

    docStore.previewPdf = pdf;

    const outline = await pdf.getOutline();
    if (outline) {
      docStore.toc = await getTOC(outline, 0, pdf);
    }

    docStore.pdf = pdf;
    docStore.activePage = 1;
    docStore.totalPages = pdf.numPages;

    // Bookmarks belong to the document, so they are (re)loaded with it. Not
    // awaited above: a slow/failing host must not delay the first paint.
    docStore.loadBookmarks();
  } catch (error) {
    failed.value = true;
    console.error('Failed to load PDF docStore:\n', error);
  }
};

const handleEscape = () => {
  if (docStore.modalContent !== MODAL_CONTENT.NULL)
    docStore.setModalContent(MODAL_CONTENT.NULL);
  else if (docStore.sidebarState !== SIDEBAR_STATE.NULL)
    docStore.setSidebarState(SIDEBAR_STATE.NULL);
  else if (docStore.editTool !== EDIT_TOOL.MOUSE)
    docStore.editTool = EDIT_TOOL.MOUSE;
  else if (docStore.scale !== 1) docStore.setScale(1);
  else if (docStore.activePage !== 1) docStore.activePage = 1;
  else if (viewerStore.closeFunction) viewerStore.closeFunction();
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
  viewerStore.config = {
    download: false,
    share: false,
    print: false,
    edit: false,
    ...config,
  };

  loadDocument();

  const handleKeydown = async (event: KeyboardEvent) => {
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
      ['c']: () => docStore.setModalContent(MODAL_CONTENT.CITATE),
    };

    const action = keyActions[event.key.toLocaleLowerCase()];
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

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });

  watch(
    () => data,
    () => loadDocument()
  );
});
</script>

<template>
  <!-- Failed container -->
  <div
    v-if="failed"
    class="efv-viewer flex flex-col h-screen w-screen justify-center items-center text-4xl uppercase font-extrabold text-white font-serif"
    :class="{ dark: isDark }"
    :style="{ backgroundColor: viewerBg }"
    :lang="viewerStore.lang"
    role="alert"
  >
    {{ $t('failed-load-pdf') }}
  </div>

  <!-- Loading -->
  <div
    v-else-if="!failed && !docStore.pdf"
    class="efv-viewer flex w-screen h-screen justify-center items-center text-white"
    :class="{ dark: isDark }"
    :style="{ backgroundColor: viewerBg }"
    :lang="viewerStore.lang"
  >
    <Loader :size="100" color="#0077CC" :label="$t('load')" />
  </div>

  <!-- Success container -->
  <div
    v-else
    class="efv-viewer flex h-screen w-screen overflow-hidden text-white"
    :style="{ backgroundColor: viewerBg }"
    :class="{ dark: isDark }"
    :lang="viewerStore.lang"
    role="region"
    :aria-label="$t('pdf-viewer')"
  >
    <!-- Modal -->
    <PDFModal v-if="docStore.modalContent !== MODAL_CONTENT.NULL" />

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
      <div class="relative flex-1 overflow-hidden">
        <!-- Edit menu -->
        <PDFEditMenu
          v-if="
            viewerStore.config.edit &&
            viewerStore.editPackage &&
            !docStore.isMobile &&
            docStore.edit
          "
        />

        <!-- PDF page -->
        <PDFPage v-if="docStore.pdf" />

        <!-- Floating sidebar panel (Search, Share, Info, Print, TOC, ...) -->
        <PDFMenuSidebar />
      </div>

      <!-- Bottom bar -->
      <PDFBottomBar />
    </div>
  </div>
</template>
