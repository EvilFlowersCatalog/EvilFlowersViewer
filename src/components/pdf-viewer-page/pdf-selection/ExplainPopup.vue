<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useViewerStore } from '@/stores';
import type { IExplainResult } from '@/assets/utils/interfaces';
import { Loader } from '@/components/pdf-aids';
import { useSideAnchoredPosition } from './useSideAnchoredPosition';

const props = defineProps<{
  pageBodyRef: HTMLDivElement | null;
  selectedText: string;
}>();

const emit = defineEmits<{ close: [] }>();

const viewerStore = useViewerStore();
const { style, calculate } = useSideAnchoredPosition(300);
const loading = ref(true);
const result = ref<IExplainResult | null>(null);
const activeTab = ref<'simple' | 'examples'>('simple');

const recalc = () => calculate(props.pageBodyRef);

onMounted(async () => {
  recalc();
  window.addEventListener('resize', recalc);

  try {
    result.value = (await viewerStore.explainFunction?.(props.selectedText)) ?? null;
  } catch {
    result.value = null;
  } finally {
    loading.value = false;
  }
});

onBeforeUnmount(() => window.removeEventListener('resize', recalc));
</script>

<template>
  <div
    class="fixed z-30 w-[300px] max-h-[380px] flex flex-col bg-white dark:bg-[#1e1e1e] rounded-[8px] shadow-[0px_6px_18px_rgba(0,0,0,0.25)] overflow-hidden"
    :style="style"
    role="dialog"
    :aria-label="$t('explain')"
  >
    <div class="flex items-center justify-between px-3 pt-2 border-b border-gray-200 dark:border-white/10 shrink-0">
      <div class="flex items-center gap-[14px]">
        <button
          type="button"
          class="pb-2 text-[12px] font-medium transition-colors"
          :class="
            activeTab === 'simple'
              ? 'text-accent-ink border-b-2 border-accent-ink'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          "
          @click="activeTab = 'simple'"
        >
          {{ $t('simple') }}
        </button>
        <button
          type="button"
          class="pb-2 text-[12px] font-medium transition-colors"
          :class="
            activeTab === 'examples'
              ? 'text-accent-ink border-b-2 border-accent-ink'
              : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
          "
          @click="activeTab = 'examples'"
        >
          {{ $t('examples') }}
        </button>
      </div>
      <button
        type="button"
        class="mb-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
        :aria-label="$t('close')"
        @click="emit('close')"
      >
        <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="flex-1 min-w-0 overflow-y-auto overflow-x-hidden p-[12px]">
      <div v-if="loading" class="flex justify-center py-6">
        <Loader :size="24" color="#0077cc" :label="$t('explain')" />
      </div>
      <div v-else-if="!result" class="flex justify-center py-6">
        <span class="text-[10px] text-[#b1b1b1]">{{ $t('no-suggestions') }}</span>
      </div>
      <p v-else-if="activeTab === 'simple'" class="text-[11px] leading-[16px] text-[#333] dark:text-gray-200 break-words">
        {{ result.simple }}
      </p>
      <ul v-else class="list-none m-0 p-0 flex flex-col gap-[10px]">
        <li
          v-for="(example, index) in result.examples"
          :key="index"
          class="text-[11px] leading-[16px] text-[#333] dark:text-gray-200 break-words"
        >
          <span class="font-semibold">{{ example.label }}:</span>
          {{ example.description }}
        </li>
      </ul>
    </div>
  </div>
</template>
