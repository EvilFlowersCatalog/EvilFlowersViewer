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
import type {
  ILayer,
  ISearchHighlight,
  ITOCItem,
} from '@/assets/utils/interfaces';
import {
  DEFAULT_PAGE,
  DEFAULT_TOOL_COLOR,
  MAX_SCALE,
  MIN_SCALE,
  MIN_TOOL_SIZE,
  MOBILE_SIZE,
  SCALE_STEP,
} from '@/assets/utils/constans';

/**
 * Per-instance document state. Refs are exposed directly (read + write) — see
 * the Pinia setup-store pattern; only operations that carry real logic (page
 * bounds, scale clamping, sidebar/modal toggling, undo/redo) are kept as
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
  const editTool = ref<EDIT_TOOL>(EDIT_TOOL.MOUSE);
  const toolColor = ref<string>(DEFAULT_TOOL_COLOR);
  const toolSize = ref<number>(MIN_TOOL_SIZE);
  const toc = ref<ITOCItem[]>([]);
  const isMobile = ref<boolean>(
    window.innerWidth <= MOBILE_SIZE || window.innerHeight <= MOBILE_SIZE
  );
  const layerState = ref<LAYER_STATE>(LAYER_STATE.NOT_READY);
  const layer = ref<ILayer | null>(null);
  const groupId = ref<string | null>(null);
  const edit = ref<boolean>(true);
  const canUndo = ref<boolean>(false);
  const canRedo = ref<boolean>(false);
  const undoFn = ref<(() => void) | null>(null);
  const redoFn = ref<(() => void) | null>(null);
  // The text match the page canvas should highlight. Owned here (not reached
  // for via the DOM) so Search and PDFPage stay decoupled and the highlight
  // survives page/zoom re-renders.
  const searchHighlight = ref<ISearchHighlight | null>(null);

  // Page is considered ready once its bitmap is painted (text layer is async
  // and must not block navigation/zoom).
  const isLoaded = () => renderState.value === RENDER_STATE.RENDERED;

  const clampScale = (val: number) =>
    val < MIN_SCALE ? MIN_SCALE : val > MAX_SCALE ? MAX_SCALE : val;

  const setScale = (val: number) => {
    if (isLoaded()) scale.value = clampScale(val);
  };
  const zoomIn = () => {
    if (isLoaded()) scale.value = clampScale(scale.value + SCALE_STEP);
  };
  const zoomOut = () => {
    if (isLoaded()) scale.value = clampScale(scale.value - SCALE_STEP);
  };

  const nextPage = () => {
    activePage.value = Math.min(activePage.value + 1, totalPages.value);
  };
  const previousPage = () => {
    activePage.value = Math.max(activePage.value - 1, 1);
  };

  // Sidebar/modal are single-slot: selecting the open item closes it.
  const setSidebarState = (val: SIDEBAR_STATE) => {
    sidebarState.value =
      sidebarState.value === val ? SIDEBAR_STATE.NULL : val;
  };
  const setModalContent = (val: MODAL_CONTENT) => {
    modalContent.value = modalContent.value === val ? MODAL_CONTENT.NULL : val;
  };

  const undo = () => {
    if (canUndo.value) undoFn.value?.();
  };
  const redo = () => {
    if (canRedo.value) redoFn.value?.();
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
    editTool,
    toolColor,
    toolSize,
    toc,
    isMobile,
    layerState,
    layer,
    groupId,
    edit,
    canUndo,
    canRedo,
    undoFn,
    redoFn,
    searchHighlight,
    // actions
    isLoaded,
    setScale,
    zoomIn,
    zoomOut,
    nextPage,
    previousPage,
    setSidebarState,
    setModalContent,
    undo,
    redo,
  };
});
