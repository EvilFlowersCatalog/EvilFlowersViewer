<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useViewerStore } from '@/stores';
import { SUGGESTION_KIND } from '@/assets/utils/enums';
import type { ISuggestedEntry } from '@/assets/utils/interfaces';
import { Loader } from '@/components/pdf-aids';
import { SuggestionEntryItem } from '@/components/pdf-viewer-page/pdf-suggestions';
import { useSideAnchoredPosition } from './useSideAnchoredPosition';

const props = defineProps<{
  pageBodyRef: HTMLDivElement | null;
  selectedText: string;
}>();

const emit = defineEmits<{ close: [] }>();

const viewerStore = useViewerStore();
const { style, calculate } = useSideAnchoredPosition(280);
const loading = ref(true);
const entries = ref<ISuggestedEntry[]>([]);

const recalc = () => calculate(props.pageBodyRef);

onMounted(async () => {
  recalc();
  window.addEventListener('resize', recalc);

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

onBeforeUnmount(() => window.removeEventListener('resize', recalc));
</script>

<template>
  <div
    class="fixed z-30 w-[280px] max-h-[380px] flex flex-col bg-white dark:bg-[#1e1e1e] rounded-[8px] shadow-[0px_6px_18px_rgba(0,0,0,0.25)] overflow-hidden"
    :style="style"
    role="dialog"
    :aria-label="$t('similar-books')"
  >
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-white/10 shrink-0">
      <h2 class="text-[12px] font-medium text-[#333] dark:text-gray-200">
        {{ $t('similar-books') }}
      </h2>
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

    <div class="flex-1 overflow-auto p-[8px]">
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
</template>
