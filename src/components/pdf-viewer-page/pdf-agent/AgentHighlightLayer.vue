<script setup lang="ts">
// Agent annotations drawn over the page: one tinted box per line of each
// highlighted sentence. Hovering a highlight shows a comment badge in its
// top-right corner; the badge opens the highlight's note and actions.
import { computed, watch } from 'vue';
import { useAssistantStore, useDocumentStore, useViewerStore } from '@/stores';
import { boxContains, boxStyle, unionBox, usePagePointer, useStickyHover } from '../usePageHover';
import { highlightColor } from './colors';
import { READER_ANNOTATION_ID } from '@/stores/assistant';

const props = defineProps<{ pageBodyRef: HTMLDivElement | null }>();

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();

const pageBody = computed(() => props.pageBodyRef);
const pointer = usePagePointer(pageBody);

const items = computed(() =>
  assistantStore.highlightsOnPage(docStore.activePage).map((item) => ({
    ...item,
    bounds: unionBox(item.highlight.quads),
  }))
);

const hitId = computed(() => {
  const point = pointer.value;
  if (!point) return null;
  return items.value.find((i) => i.highlight.quads.some((q) => boxContains(q, point)))?.highlight.id ?? null;
});

const hover = useStickyHover(hitId);
const active = computed(() => items.value.find((i) => i.highlight.id === hover.activeId.value) ?? null);

// Navigating from the sidebar or the card's arrows opens the target's card.
watch(
  () => [assistantStore.activeHighlightId, items.value.length] as const,
  ([id]) => {
    if (id && items.value.some((i) => i.highlight.id === id)) hover.open(id);
  },
  { immediate: true }
);

// A page change closes the card, unless it was the navigation to that card.
watch(
  () => docStore.activePage,
  () => {
    if (!items.value.some((i) => i.highlight.id === assistantStore.activeHighlightId)) hover.close();
  }
);

const close = () => {
  hover.close();
  assistantStore.activeHighlightId = null;
};

const askInChat = () => {
  if (!active.value) return;
  assistantStore.addContext({
    kind: 'highlight',
    annotationId: active.value.annotation.id,
    highlight: active.value.highlight,
  });
  close();
};

const remove = () => {
  if (!active.value) return;
  const { annotation, highlight } = active.value;
  close();
  assistantStore.deleteHighlight(annotation.id, highlight.id);
};

const step = (direction: 1 | -1) => {
  if (active.value) assistantStore.stepHighlight(active.value.annotation.id, direction);
};

const showInList = () => {
  if (active.value) assistantStore.activeHighlightId = active.value.highlight.id;
  assistantStore.openHighlightsSidebar();
};

const isReader = computed(() => active.value?.annotation.id === READER_ANNOTATION_ID);
const canDelete = computed(() =>
  isReader.value
    ? !!viewerStore.readerHighlightPackage?.deleteHighlightFunc
    : !!viewerStore.agentAnnotationPackage?.deleteHighlightFunc
);

const cardSide = computed(() => (active.value && active.value.bounds.x1 > 0.55 ? 'left' : 'right'));
</script>

<template>
  <div
    v-if="viewerStore.agentAnnotationPackage || viewerStore.readerHighlightPackage"
    class="absolute inset-0 z-[5] pointer-events-none"
  >
    <!-- Tinted line boxes (multiply keeps the text readable) -->
    <template v-for="item in items" :key="item.highlight.id">
      <div
        v-for="(quad, index) in item.highlight.quads"
        :key="index"
        class="absolute mix-blend-multiply dark:mix-blend-normal rounded-[2px] transition-opacity duration-150"
        :class="assistantStore.activeHighlightId === item.highlight.id ? 'efv-highlight-active' : ''"
        :style="{
          ...boxStyle(quad),
          backgroundColor: highlightColor(item.colorIndex, active?.highlight.id === item.highlight.id ? 0.55 : 0.35),
        }"
      />
    </template>

    <!-- Comment badge at the top-right corner of the hovered highlight -->
    <div
      v-if="active"
      class="absolute pointer-events-auto"
      :style="{ left: `${active.bounds.x1 * 100}%`, top: `${active.bounds.y0 * 100}%` }"
      @mouseenter="hover.holdEnter"
      @mouseleave="hover.holdLeave"
    >
      <button
        type="button"
        class="-translate-x-1/2 -translate-y-[85%] flex items-center justify-center min-w-6 h-6 px-1 rounded-[10px_10px_10px_2px] text-white text-[10px] font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
        :style="{ backgroundColor: highlightColor(active.colorIndex, 1) }"
        :aria-expanded="hover.cardOpen.value"
        :aria-label="$t('agent-highlight-n', { n: active.highlight.seq })"
        @click="hover.togglePin"
      >
        {{ active.highlight.seq }}
      </button>

      <!-- Card -->
      <div
        v-if="hover.cardOpen.value"
        class="absolute top-2 w-[280px] flex flex-col bg-white dark:bg-[#1e1e1e] rounded-[8px] shadow-[0px_6px_18px_rgba(0,0,0,0.25)] overflow-hidden cursor-auto"
        :class="cardSide === 'right' ? 'left-3' : 'right-3'"
        role="dialog"
        :aria-label="isReader ? $t('my-highlights') : active.annotation.title"
        @mousedown.stop
        @dblclick.stop
      >
        <div class="flex items-center gap-1 px-3 py-2 border-b border-gray-200 dark:border-white/10">
          <span
            class="size-2 rounded-full shrink-0"
            :style="{ backgroundColor: highlightColor(active.colorIndex, 1) }"
            aria-hidden="true"
          />
          <span class="flex-1 min-w-0 truncate text-[11px] font-semibold text-[#333] dark:text-gray-200">
            {{ isReader ? $t('my-highlights') : active.annotation.title }}
          </span>
          <span class="text-[10px] text-efv-muted shrink-0">
            {{ active.highlight.seq }} / {{ active.annotation.highlights.length }}
          </span>
          <button
            type="button"
            class="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
            :aria-label="$t('previous-result')"
            @click="step(-1)"
          >
            <svg aria-hidden="true" class="size-3" viewBox="0 0 20 20" fill="none"><path d="M12 5l-5 5 5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <button
            type="button"
            class="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
            :aria-label="$t('next-result')"
            @click="step(1)"
          >
            <svg aria-hidden="true" class="size-3" viewBox="0 0 20 20" fill="none"><path d="M8 5l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <button
            type="button"
            class="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
            :aria-label="$t('close')"
            @click="close"
          >
            <svg aria-hidden="true" class="size-3" viewBox="0 0 20 20" fill="none"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" /></svg>
          </button>
        </div>

        <div class="px-3 py-2 flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
          <p class="text-[11px] leading-[15px] text-[#333] dark:text-gray-200">„{{ active.highlight.text }}“</p>
          <p v-if="active.highlight.note" class="text-[10px] leading-[14px] text-efv-muted">{{ active.highlight.note }}</p>
          <p v-if="active.annotation.prompt" class="text-[10px] leading-[14px] text-efv-muted italic line-clamp-2">
            {{ $t('agent-prompt') }}: {{ active.annotation.prompt }}
          </p>
        </div>

        <div class="flex items-center gap-1.5 px-3 py-2 border-t border-gray-200 dark:border-white/10">
          <button
            v-if="viewerStore.chatPackage"
            type="button"
            class="efv-card-btn bg-secondary text-white hover:bg-secondary-strong"
            @click="askInChat"
          >
            {{ $t('ask-in-chat') }}
          </button>
          <button
            type="button"
            class="efv-card-btn bg-accent-soft text-accent-ink hover:brightness-95"
            @click="showInList"
          >
            {{ $t('show-in-list') }}
          </button>
          <button
            v-if="canDelete"
            type="button"
            class="shrink-0 size-7 flex items-center justify-center rounded-[5px] text-gray-400 hover:text-red hover:bg-red/10 transition-colors"
            :aria-label="$t('delete')"
            :title="$t('delete')"
            @click="remove"
          >
            <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
              <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
