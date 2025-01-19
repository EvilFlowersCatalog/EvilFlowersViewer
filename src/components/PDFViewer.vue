<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
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

// Props
const { data, options, config } = defineProps<IViewerProps>();
const viewerStore = useViewerStore();
const docStore = useDocumentStore();
const failed = ref<boolean>(false);

// Load table of contents via pdfjs-dist from pdf file
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
          if (dest) {
            ref = dest[0];
          }
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

const loadDocument = async () => {
  try {
    // Dynamically set the language
    if (options?.lang) i18n.global.locale = options.lang;

    const [pdf, previewPdf] = await Promise.all([
      getDocument({ data: new Uint8Array(data) }).promise,
      getDocument({ data: new Uint8Array(data) }).promise,
    ]);

    // Set for preview PDF
    docStore.setPreviewPdf(previewPdf);

    // Get and set TOC
    const outline = await pdf.getOutline();
    // Case where we have outlines
    if (outline) {
      const toc = await getTOC(outline, 0, pdf);

      docStore.setTOC(toc);
    }

    // Set docStore info to docStore
    docStore.setPdf(pdf);
    docStore.setActivePage(1);
    docStore.setTotalPages(pdf.numPages);
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
    docStore.setEditTool(EDIT_TOOL.MOUSE);
  else if (docStore.scale !== 1) docStore.setScale(1);
  else if (docStore.activePage !== 1) docStore.setActivePage(1);
  else if (viewerStore.closeFunction) viewerStore.closeFunction();
};

onMounted(() => {
  // Set optional props
  viewerStore.setCitation(options?.citationBib ?? null);
  viewerStore.setBasedCitation(options?.citationBib ?? null);
  viewerStore.setCloseFunction(options?.closeFunction ?? null);
  viewerStore.setHomeFunction(options?.homeFunction ?? null);
  viewerStore.setEditPackage(options?.editPackage ?? null);
  viewerStore.setLang(options?.lang ?? 'en');
  viewerStore.setShareFunction(options?.shareFunction ?? null);
  viewerStore.setPrintFunction(options?.printFunction ?? null);
  viewerStore.setConfig({
    ...{
      download: false,
      share: false,
      print: false,
      edit: false,
    },
    ...config,
  });

  // Load data
  loadDocument();

  // Handling key events
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
      ['t']: () => docStore.setModalContent(MODAL_CONTENT.TOC),
      ['c']: () => docStore.setModalContent(MODAL_CONTENT.CITATE),
    };

    const action = keyActions[event.key.toLocaleLowerCase()];
    if (action) {
      event.preventDefault();
      action();
    }
  };

  // Handle fullscreen change
  const handleFullscreenChange = () => {
    if (document.fullscreenElement) docStore.setIsFullscreenMode(true);
    else docStore.setIsFullscreenMode(false);
  };

  // Handle resizing
  const handleResize = () => {
    const isMobile: boolean =
      window.innerWidth <= MOBILE_SIZE || window.innerHeight <= MOBILE_SIZE;
    docStore.setIsMobile(isMobile);
  };

  // Attach the event listener
  window.addEventListener('keydown', handleKeydown);
  window.addEventListener('resize', handleResize);
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // Cleanup the event
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('resize', handleResize);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
  });

  // If data change, load document again
  watch(
    () => data,
    () => loadDocument()
  );
});

function useSpring(motionProperties: any): { set: any } {
  throw new Error('Function not implemented.');
}
</script>

<template>
  <!-- Failed container -->
  <div
    v-if="failed"
    class="flex flex-col h-screen w-screen bg-zinc-200 justify-center items-center text-4xl uppercase font-extrabold text-gray-dark font-serif"
  >
    {{ $t('failed-load-pdf') }}
  </div>

  <!-- Loading -->
  <div
    v-else-if="!failed && !docStore.pdf"
    class="flex w-screen h-screen justify-center items-center"
  >
    <Loader :size="100" color="#4a9cff" />
  </div>

  <!-- Success container -->
  <div
    v-else
    class="flex flex-col h-screen w-screen bg-zinc-200 text-white overflow-hidden"
  >
    <!-- Modal -->
    <PDFModal v-if="docStore.modalContent !== MODAL_CONTENT.NULL" />

    <!-- Layer state -->
    <div
      v-if="docStore.layerState !== LAYER_STATE.DONE && docStore.edit"
      class="fixed top-2 left-0 w-full flex justify-center z-20 pointer-events-none select-none"
    >
      <div class="bg-primary flex flex-col gap-2 items-center p-4 rounded-md">
        <Loader :size="50" color="#36BA98" />
        <span class="text-secondary">{{ $t(docStore.layerState) }}</span>
      </div>
    </div>

    <!-- Inner container -->
    <div class="relative flex w-full h-full overflow-hidden">
      <!-- Menu -->
      <PDFMenu />

      <!-- Edit menu -->
      <PDFEditMenu
        v-if="
          viewerStore.config.edit &&
          viewerStore.editPackage &&
          !docStore.isMobile &&
          docStore.edit
        "
      />

      <!-- Sidebar -->
      <PDFMenuSidebar />

      <!-- Main content -->
      <PDFPage v-if="docStore.pdf" />
    </div>

    <!-- Preview bar -->
    <PDFBottomBar />
  </div>
</template>
