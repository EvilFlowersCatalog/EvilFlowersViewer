<script setup lang="ts">
// Books similar to the selected text. Same floating card as figures and
// highlights: beside the selection, inside the visible page area (never over
// the chat or under the bottom bar), draggable by its header.
import { onMounted, ref } from 'vue';
import { useViewerStore } from '@/stores';
import { SUGGESTION_KIND } from '@/assets/utils/enums';
import type { ISuggestedEntry } from '@/assets/utils/interfaces';
import type { IPageBox } from '@/assets/utils/interfaces';
import { FloatingCard, Loader } from '@/components/pdf-aids';
import { SuggestionEntryItem } from '@/components/pdf-viewer-page/pdf-suggestions';
import { boxToViewport, pageViewport } from '../usePageHover';

const props = defineProps<{
  pageBodyRef: HTMLDivElement | null;
  selectedText: string;
  anchorRect: DOMRect | null;
}>();

const emit = defineEmits<{ close: [] }>();

const viewerStore = useViewerStore();
const loading = ref(true);
const entries = ref<ISuggestedEntry[]>([]);

// The selection as page fractions, so the card follows it on scroll and zoom.
const toPageBox = (): IPageBox | null => {
  const body = props.pageBodyRef?.getBoundingClientRect();
  const rect = props.anchorRect;
  if (!body?.width || !body.height || !rect) return null;
  return {
    x0: (rect.left - body.left) / body.width,
    y0: (rect.top - body.top) / body.height,
    x1: (rect.right - body.left) / body.width,
    y1: (rect.bottom - body.top) / body.height,
  };
};
const selectionBox = toPageBox();
const cardAnchor = () => (selectionBox ? boxToViewport(props.pageBodyRef, selectionBox) : null);
const cardBounds = () => pageViewport(props.pageBodyRef);

onMounted(async () => {
  try {
    entries.value =
      (await viewerStore.suggestionsFunction?.(SUGGESTION_KIND.SIMILAR, {
        selectedText: props.selectedText,
      })) ?? [];
  } catch {
    entries.value = [];
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <FloatingCard :anchor="cardAnchor" :bounds="cardBounds">
  <div
    class="w-[300px] max-w-full min-h-0 max-h-[400px] flex flex-col bg-white dark:bg-[#1e1e1e] rounded-[8px] shadow-[0px_6px_18px_rgba(0,0,0,0.25)] overflow-hidden"
    role="dialog"
    :aria-label="$t('similar-books')"
  >
    <!-- Header doubles as the drag handle -->
    <div
      data-drag-handle
      class="flex items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-white/10 shrink-0 select-none touch-none cursor-grab"
    >
      <h2 class="flex-1 text-[12px] font-medium text-[#333] dark:text-gray-200">
        {{ $t('similar-books') }}
      </h2>
      <svg aria-hidden="true" class="size-3.5 text-gray-300 dark:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
        <circle cx="7" cy="5" r="1.4" /><circle cx="13" cy="5" r="1.4" />
        <circle cx="7" cy="10" r="1.4" /><circle cx="13" cy="10" r="1.4" />
        <circle cx="7" cy="15" r="1.4" /><circle cx="13" cy="15" r="1.4" />
      </svg>
      <button
        type="button"
        class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
        :aria-label="$t('close')"
        @click="emit('close')"
      >
        <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="flex-1 min-h-0 overflow-auto p-[8px]">
      <div v-if="loading" class="flex justify-center py-6">
        <Loader :size="24" color="#0077cc" :label="$t('similar-books')" />
      </div>
      <div v-else-if="entries.length === 0" class="flex justify-center py-6">
        <span class="text-[10px] text-[#b1b1b1]">{{ $t('no-suggestions') }}</span>
      </div>
      <div v-else class="flex flex-col gap-[2px]">
        <SuggestionEntryItem v-for="entry in entries" :key="entry.id" :entry="entry" variant="row" />
      </div>
    </div>
  </div>
  </FloatingCard>
</template>
