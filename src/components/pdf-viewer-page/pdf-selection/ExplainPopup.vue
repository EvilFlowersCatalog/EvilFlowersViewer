<script setup lang="ts">
// Floating "explain" card. Spawns next to the page (or where the reader last
// dropped it), can be dragged by its header, and hands the explanation over to
// the chat. Driven by assistantStore.explainRequest, so it outlives the text
// selection that opened it.
import { onMounted, ref } from 'vue';
import { useAssistantStore, useViewerStore } from '@/stores';
import type { IExplainResult } from '@/assets/utils/interfaces';
import { Loader } from '@/components/pdf-aids';
import { useDraggable } from '@/components/pdf-aids/useDraggable';
import type { IExplainRequest } from '@/stores/assistant';

const WIDTH = 300;

const props = defineProps<{ request: IExplainRequest }>();

const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();
const { style, place, position, dragging, handle } = useDraggable(WIDTH);
const loading = ref(true);
const result = ref<IExplainResult | null>(null);
const activeTab = ref<'simple' | 'examples'>('simple');

// Right of the page when there is room, otherwise over the page's right edge
// (so it never covers the docked chat), then wherever the reader drags it.
const spawn = () => {
  if (assistantStore.explainPosition) {
    place(assistantStore.explainPosition.x, assistantStore.explainPosition.y);
    return;
  }
  const margin = 12;
  const rect = props.request.anchor;
  if (!rect) place(window.innerWidth - WIDTH - margin, 80);
  else if (rect.right + margin + WIDTH <= (document.querySelector('[data-chat-panel]')?.getBoundingClientRect().left ?? window.innerWidth))
    place(rect.right + margin, rect.top + 40);
  else place(rect.right - WIDTH - margin, rect.top + 40);
};

const onDragEnd = () => {
  if (dragging.value) assistantStore.explainPosition = { ...position.value };
  handle.pointerup();
};

const close = () => assistantStore.closeExplain();

const discussInChat = () => {
  if (!result.value) return;
  assistantStore.addContext({
    kind: 'explain',
    text: props.request.text,
    page: props.request.page,
    explanation: result.value.simple,
    regionId: props.request.regionId,
  });
  close();
};

onMounted(async () => {
  spawn();
  try {
    result.value =
      (await viewerStore.explainFunction?.(props.request.text, {
        page: props.request.page,
        regionId: props.request.regionId,
      })) ?? null;
  } catch {
    result.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div
    class="fixed z-40 w-[300px] max-h-[420px] flex flex-col bg-white dark:bg-[#1e1e1e] rounded-[8px] shadow-[0px_6px_18px_rgba(0,0,0,0.25)] overflow-hidden"
    :style="style"
    role="dialog"
    :aria-label="$t('explain')"
  >
    <!-- Header doubles as the drag handle -->
    <div
      class="flex items-center justify-between px-3 pt-2 border-b border-gray-200 dark:border-white/10 shrink-0 select-none touch-none"
      :class="dragging ? 'cursor-grabbing' : 'cursor-grab'"
      @pointerdown="handle.pointerdown"
      @pointermove="handle.pointermove"
      @pointerup="onDragEnd"
      @pointercancel="onDragEnd"
    >
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
      <div class="flex items-center gap-1 mb-2">
        <!-- Grip hint -->
        <svg aria-hidden="true" class="size-3.5 text-gray-300 dark:text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="7" cy="5" r="1.4" /><circle cx="13" cy="5" r="1.4" />
          <circle cx="7" cy="10" r="1.4" /><circle cx="13" cy="10" r="1.4" />
          <circle cx="7" cy="15" r="1.4" /><circle cx="13" cy="15" r="1.4" />
        </svg>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
          :aria-label="$t('close')"
          @click="close"
        >
          <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Quoted source -->
    <p class="px-3 pt-2 text-[10px] leading-[14px] italic text-efv-muted line-clamp-2 break-words shrink-0">
      „{{ request.text }}“ · {{ $t('page-short', { page: request.page }) }}
    </p>

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

    <!-- Hand-off to the chat -->
    <div
      v-if="viewerStore.chatPackage && result"
      class="shrink-0 px-3 py-2 border-t border-gray-200 dark:border-white/10 flex justify-end"
    >
      <button
        type="button"
        class="flex items-center gap-1.5 px-2.5 py-1 rounded-[5px] text-[11px] font-medium bg-accent-soft text-accent-ink hover:brightness-95 transition"
        @click="discussInChat"
      >
        <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
          <path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
        </svg>
        {{ $t('discuss-in-chat') }}
      </button>
    </div>
  </div>
</template>
