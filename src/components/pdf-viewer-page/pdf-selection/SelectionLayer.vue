<script setup lang="ts">
// The selection menu of one page, and what its actions do. The selection
// itself is tracked once for the whole viewer (useTextSelection); this page
// shows the menu when a finished selection starts on it. Explain also covers
// "similar publications" (its card has an "Elsewhere" section), so the menu
// only offers Similar to hosts without Explain.
import { computed, ref } from 'vue';
import { useAssistantStore, useDocumentStore, useSearchStore, useViewerStore } from '@/stores';
import type { ISelectionInfo, VIEWER_ACTION } from '@/assets/utils/interfaces';
import SelectionMenu, { type SelectionMenuAction } from './SelectionMenu.vue';
import SimilarBooksPopup from './SimilarBooksPopup.vue';
import { useEscapeLayer } from '@/components/pdf-aids/useEscapeLayer';
import { useTextSelection } from '@/composables/useTextSelection';
import { useAnnouncer } from '@/composables/useAnnouncer';
import { usePageContext } from '../usePageContext';
import { copyText } from '@/core/clipboard';
import { useI18n } from 'vue-i18n';

const props = defineProps<{ pageBodyRef: HTMLDivElement | null }>();
const emit = defineEmits<{ highlight: [selection: ISelectionInfo] }>();

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();
const searchStore = useSearchStore();
const textSelection = useTextSelection();
const { announce } = useAnnouncer();
const { t } = useI18n();
const { page } = usePageContext();

// A selection belongs to the page it starts on.
const selection = computed<ISelectionInfo | null>(() => {
  const state = textSelection?.state.value;
  return state?.kind === 'selected' && state.selection.page === page.value ? state.selection : null;
});
const boxes = computed(() => selection.value?.segments.find((s) => s.page === page.value)?.boxes ?? []);
const similarFor = ref<ISelectionInfo | null>(null);
/** Brief feedback on a copy action: done, or (for a link) failed. */
const feedback = ref<{ action: 'copy' | 'link'; ok: boolean } | null>(null);

const actions = computed<SelectionMenuAction[]>(() => {
  const list: SelectionMenuAction[] = [];
  if (viewerStore.explainFunction) list.push('explain');
  if (docStore.edit || viewerStore.readerHighlightPackage) list.push('highlight');
  list.push('copy');
  if (viewerStore.linkFunction) list.push('link');
  if (viewerStore.chatPackage) list.push('ask');
  // Short phrases only: "find every occurrence" of a paragraph means nothing.
  if ((selection.value?.text.length ?? 0) <= 80) list.push('search');
  if (!viewerStore.explainFunction && viewerStore.suggestionsFunction) list.push('similar');
  return list;
});

const done = () => textSelection?.clear();

useEscapeLayer(() => selection.value !== null, done);

const report = (action: VIEWER_ACTION) => {
  viewerStore.events.emit('action', { action });
  viewerStore.telemetry.record('selection.action', { action, length: selection.value?.text.length ?? 0 });
};

const flash = (action: 'copy' | 'link', ok: boolean) => {
  feedback.value = { action, ok };
  announce(t(ok ? (action === 'link' ? 'link-copied' : 'copied') : action === 'link' ? 'link-failed-short' : 'copy-failed'), 0);
  setTimeout(() => {
    feedback.value = null;
    if (ok) done();
  }, ok ? 700 : 1600);
};

const run = async (action: SelectionMenuAction) => {
  const current = selection.value;
  if (!current) return;
  report(action === 'search' ? 'search-selection' : action === 'link' ? 'copy-link' : action);
  switch (action) {
    case 'copy':
      flash('copy', await copyText(current.text));
      return;
    case 'link': {
      // The host makes the link (#155); the viewer only passes where.
      let url: string | null = null;
      try {
        url = (await viewerStore.linkFunction?.({ page: current.page, selection: current })) || null;
      } catch {
        url = null;
      }
      flash('link', !!url && (await copyText(url)));
      return;
    }
    case 'highlight':
      emit('highlight', current);
      break;
    case 'explain':
      assistantStore.openExplain({
        text: current.text,
        page: current.page,
        segments: current.segments,
        anchor: props.pageBodyRef?.getBoundingClientRect() ?? null,
      });
      break;
    case 'ask':
      assistantStore.addContext({ kind: 'selection', text: current.text, page: current.page });
      break;
    case 'search':
      // The find pill steps through the matches; the Navigator stays as it is.
      void searchStore.run(current.text);
      break;
    case 'similar':
      similarFor.value = current;
      break;
  }
  done();
};
</script>

<template>
  <SelectionMenu v-if="selection && boxes.length" :boxes="boxes" :actions="actions" :feedback="feedback" @action="run" />
  <SimilarBooksPopup
    v-if="similarFor"
    :page-body-ref="pageBodyRef"
    :selected-text="similarFor.text"
    :box="similarFor.segments[0]?.boxes[0] ?? null"
    @close="similarFor = null"
  />
</template>
