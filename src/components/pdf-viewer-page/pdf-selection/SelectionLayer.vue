<script setup lang="ts">
// Invisible: watches text selection over this page and drives the popups.
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { debounce } from '@/assets/utils/functions';
import { useAssistantStore, useDocumentStore, useViewerStore } from '@/stores';
import SelectionMenu from './SelectionMenu.vue';
import SimilarBooksPopup from './SimilarBooksPopup.vue';

const props = defineProps<{
  textLayerRef: HTMLDivElement | null;
  pageBodyRef: HTMLDivElement | null;
}>();

const emit = defineEmits<{ highlight: [rects: DOMRect[]] }>();

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();

const selectionText = ref('');
const selectionRects = ref<DOMRect[]>([]);
const anchorRect = ref<DOMRect | null>(null);
const activePopup = ref<'similar' | null>(null);

const getSelectionRects = (range: Range): DOMRect[] => {
  const startContainer = range.commonAncestorContainer;
  const root = startContainer.nodeType === Node.TEXT_NODE
    ? startContainer.parentNode!
    : startContainer;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);

  const rects: DOMRect[] = [];
  let node = walker.nextNode();
  while (node) {
    if (range.intersectsNode(node)) {
      const nodeRange = document.createRange();
      nodeRange.selectNodeContents(node);
      if (node === range.startContainer) nodeRange.setStart(node, range.startOffset);
      if (node === range.endContainer) nodeRange.setEnd(node, range.endOffset);
      for (const rect of nodeRange.getClientRects()) {
        if (rect.width > 0 && rect.height > 0) rects.push(rect);
      }
    }
    node = walker.nextNode();
  }
  return rects;
};

const clearSelection = () => {
  anchorRect.value = null;
  selectionText.value = '';
  selectionRects.value = [];
  activePopup.value = null;
};

// Debounced: selectionchange fires continuously while dragging.
const handleSelectionChange = debounce(() => {
  const sel = window.getSelection();
  const collapsed = !sel || sel.isCollapsed || sel.toString().trim() === '';

  if (collapsed) {
    // Clicking inside an open popup can collapse the selection — don't dismiss it.
    if (activePopup.value === null) clearSelection();
    return;
  }

  const anchorNode = sel!.anchorNode;
  if (!props.textLayerRef || !anchorNode || !props.textLayerRef.contains(anchorNode)) {
    return; // selection belongs to a different page's text layer
  }

  const range = sel!.getRangeAt(0);
  selectionText.value = sel!.toString();
  selectionRects.value = getSelectionRects(range);
  anchorRect.value = range.getBoundingClientRect();
  activePopup.value = null; // a fresh selection re-shows the menu, not a stale popup
}, 150);

onMounted(() => document.addEventListener('selectionchange', handleSelectionChange));
onBeforeUnmount(() =>
  document.removeEventListener('selectionchange', handleSelectionChange)
);

const handleCopy = () => {
  if (selectionText.value) navigator.clipboard.writeText(selectionText.value);
};

const handleHighlight = () => {
  if (selectionRects.value.length) emit('highlight', selectionRects.value);
  window.getSelection()?.removeAllRanges();
  clearSelection();
};

// The explain popup lives at the viewer root (draggable, survives the
// selection), so the selection only hands it the text and goes away.
const handleExplain = () => {
  assistantStore.openExplain({
    text: selectionText.value,
    page: docStore.activePage,
    anchor: props.pageBodyRef?.getBoundingClientRect() ?? null,
  });
  window.getSelection()?.removeAllRanges();
  clearSelection();
};

const handleAsk = () => {
  assistantStore.addContext({ kind: 'selection', text: selectionText.value.trim(), page: docStore.activePage });
  window.getSelection()?.removeAllRanges();
  clearSelection();
};
</script>

<template>
  <template v-if="anchorRect">
    <SelectionMenu
      v-if="activePopup === null"
      :anchor-rect="anchorRect"
      :show-similar="!!viewerStore.suggestionsFunction"
      :show-highlight="docStore.edit"
      :show-explain="!!viewerStore.explainFunction"
      :show-ask="!!viewerStore.chatPackage"
      @copy="handleCopy"
      @similar="activePopup = 'similar'"
      @highlight="handleHighlight"
      @explain="handleExplain"
      @ask="handleAsk"
    />
    <SimilarBooksPopup
      v-else-if="activePopup === 'similar'"
      :page-body-ref="pageBodyRef"
      :selected-text="selectionText"
      @close="clearSelection"
    />
  </template>
</template>
