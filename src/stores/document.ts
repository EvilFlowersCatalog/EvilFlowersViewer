import { ref } from 'vue';
import { defineStore } from 'pinia';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import {
  EDIT_TOOL,
  LAYER_STATE,
  MODAL_CONTENT,
  RENDER_STATE,
  SIDEBAR_STATE,
} from '@/assets/utils/enums';
import type { ILayer, ITOCItem } from '@/assets/utils/interfaces';
import {
  DEFAULT_PAGE,
  DEFAULT_TOOL_COLOR,
  MIN_TOOL_SIZE,
  MOBILE_SIZE,
} from '@/assets/utils/constans';

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
  const reRenderPage = ref<boolean>(false);
  const editTool = ref<EDIT_TOOL>(EDIT_TOOL.MOUSE);
  const toolColor = ref<string>(DEFAULT_TOOL_COLOR);
  const toolSize = ref<number>(MIN_TOOL_SIZE);
  const toc = ref<ITOCItem[]>([]);
  const isMobile = ref<boolean>(
    window.innerWidth <= MOBILE_SIZE || window.innerHeight <= MOBILE_SIZE
  );
  const layerState = ref<LAYER_STATE>(LAYER_STATE.DONE);
  const layer = ref<ILayer | null>(null);
  const groupId = ref<string | null>(null);
  const edit = ref<boolean>(true);

  // Check if everything is isLoaded
  const isLoaded = () => {
    return (
      renderState.value === RENDER_STATE.RENDERED &&
      layerState.value === LAYER_STATE.DONE
    );
  };

  // Setters
  const setPdf = (val: PDFDocumentProxy) => {
    pdf.value = val;
  };
  const setPreviewPdf = (val: PDFDocumentProxy) => {
    previewPdf.value = val;
  };
  const setActivePage = (val: number) => {
    if (isLoaded()) activePage.value = val;
  };
  const nextPage = () => {
    if (isLoaded()) {
      const page = activePage.value + 1;
      activePage.value = page > totalPages.value ? totalPages.value : page;
    }
  };
  const previousPage = () => {
    if (isLoaded()) {
      const page = activePage.value - 1;
      activePage.value = page < 1 ? 1 : page;
    }
  };
  const setTotalPages = (val: number) => {
    totalPages.value = val;
  };
  const setScale = (val: number) => {
    if (isLoaded()) scale.value = val < 0.25 ? 0.25 : val <= 3 ? val : 3;
  };
  const setCanvasWidth = (val: number) => {
    canvasWidth.value = val;
  };
  const setCanvasHeight = (val: number) => {
    canvasHeight.value = val;
  };
  const zoomOut = () => {
    if (isLoaded()) {
      const newScale = scale.value - 0.25;
      scale.value = newScale < 0.25 ? 0.25 : newScale;
    }
  };
  const zoomIn = () => {
    if (isLoaded()) {
      const newScale = scale.value + 0.25;
      scale.value = newScale > 3 ? 3 : newScale;
    }
  };
  const setRenderState = (val: RENDER_STATE) => {
    renderState.value = val;
  };
  const setSidebarState = (val: SIDEBAR_STATE) => {
    if (sidebarState.value === val) sidebarState.value = SIDEBAR_STATE.NULL;
    else sidebarState.value = val;
  };
  const setModalContent = (value: MODAL_CONTENT) => {
    if (modalContent.value === value) modalContent.value = MODAL_CONTENT.NULL;
    else modalContent.value = value;
  };
  const setIsFullscreenMode = (value: boolean) => {
    isFullscreenMode.value = value;
  };
  const setReRenderPage = (value: boolean) => {
    reRenderPage.value = value;
  };
  const setEditTool = (value: EDIT_TOOL) => {
    editTool.value = value;
  };
  const setToolSize = (value: number) => {
    toolSize.value = value;
  };
  const setToolColor = (value: string) => {
    toolColor.value = value;
  };
  const setTOC = (value: ITOCItem[]) => {
    toc.value = value;
  };
  const setIsMobile = (value: boolean) => {
    isMobile.value = value;
  };
  const setLayerState = (value: LAYER_STATE) => {
    layerState.value = value;
  };
  const setLayer = (value: ILayer | null) => {
    layer.value = value;
  };
  const setEdit = (value: boolean) => {
    edit.value = value;
  };
  const setGroupId = (value: string) => {
    groupId.value = value;
  };

  return {
    pdf,
    previewPdf,
    activePage,
    totalPages,
    scale,
    renderState,
    isFullscreenMode,
    sidebarState,
    modalContent,
    reRenderPage,
    editTool,
    toolColor,
    toolSize,
    toc,
    canvasHeight,
    canvasWidth,
    isMobile,
    layerState,
    layer,
    edit,
    groupId,
    setGroupId,
    setEdit,
    setLayer,
    setPdf,
    setPreviewPdf,
    setActivePage,
    setTotalPages,
    setRenderState,
    setScale,
    setIsFullscreenMode,
    setModalContent,
    setLayerState,
    zoomIn,
    zoomOut,
    nextPage,
    previousPage,
    setSidebarState,
    setReRenderPage,
    setEditTool,
    setToolColor,
    setToolSize,
    setTOC,
    setCanvasWidth,
    setCanvasHeight,
    setIsMobile,
    print,
  };
});
