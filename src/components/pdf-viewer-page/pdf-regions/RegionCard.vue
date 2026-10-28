<script setup lang="ts">
// What the catalog knows about one region: crop, caption, table or LaTeX, and
// the actions that hand it to the assistant.
import { computed, onMounted, ref } from 'vue';
import { useAssistantStore, useViewerStore } from '@/stores';
import type { IRegion } from '@/assets/utils/interfaces';
import { renderMarkdown } from '@/assets/utils/markdown';

const props = defineProps<{ region: IRegion; canvasRef: HTMLCanvasElement | null }>();
const emit = defineEmits<{ close: [] }>();

const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();

// Without a crop URL from the host, cut the region out of the rendered page.
const preview = ref<string | null>(props.region.imageUrl ?? null);
onMounted(() => {
  if (preview.value || props.region.kind === 'table' || !props.canvasRef) return;
  const source = props.canvasRef;
  const { x0, y0, x1, y1 } = props.region.bbox;
  const sx = x0 * source.width;
  const sy = y0 * source.height;
  const sw = Math.max(1, (x1 - x0) * source.width);
  const sh = Math.max(1, (y1 - y0) * source.height);
  const crop = document.createElement('canvas');
  crop.width = sw;
  crop.height = sh;
  crop.getContext('2d')?.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  try {
    preview.value = crop.toDataURL('image/png');
  } catch {
    preview.value = null;
  }
});

const tableHtml = computed(() =>
  props.region.markdown ? renderMarkdown(props.region.markdown, { page: (p) => p, region: (id) => id }) : ''
);

// The text explain/chat get for a region: its caption, table or formula.
const regionText = computed(
  () => props.region.caption ?? props.region.markdown ?? props.region.latex ?? props.region.kind
);

const addToChat = () => {
  assistantStore.addContext({ kind: 'region', region: props.region });
  emit('close');
};

const explain = (event: MouseEvent) => {
  const pageBody = (event.currentTarget as HTMLElement).closest('[data-page-body]');
  assistantStore.openExplain({
    text: regionText.value,
    page: props.region.page,
    regionId: props.region.id,
    anchor: pageBody?.getBoundingClientRect() ?? null,
  });
  emit('close');
};
</script>

<template>
  <div
    class="w-[280px] max-h-[360px] flex flex-col bg-white dark:bg-[#1e1e1e] rounded-[8px] shadow-[0px_6px_18px_rgba(0,0,0,0.25)] overflow-hidden text-left cursor-auto"
    role="dialog"
    :aria-label="$t(`region-${region.kind}`)"
    @mousedown.stop
    @dblclick.stop
  >
    <div class="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-white/10 shrink-0">
      <span class="text-[11px] font-semibold text-[#333] dark:text-gray-200">
        {{ $t(`region-${region.kind}`) }}
        <span class="font-normal text-efv-muted">· {{ $t('page-short', { page: region.page }) }}</span>
        <span v-if="region.category" class="ml-1 px-1.5 py-[1px] rounded bg-accent-soft text-accent-ink text-[9px] font-medium">
          {{ region.category }}
        </span>
      </span>
      <button
        type="button"
        class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
        :aria-label="$t('close')"
        @click="emit('close')"
      >
        <svg aria-hidden="true" class="size-3" viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
      <img
        v-if="preview"
        :src="preview"
        :alt="region.caption ?? ''"
        class="w-full max-h-[120px] object-contain rounded border border-efv-border bg-white"
      />
      <p v-if="region.caption" class="text-[11px] leading-[15px] text-[#333] dark:text-gray-200">{{ region.caption }}</p>
      <div v-if="tableHtml" class="efv-md text-[11px] text-[#333] dark:text-gray-200" v-html="tableHtml" />
      <code
        v-if="region.latex"
        class="block text-[11px] px-2 py-1.5 rounded bg-field text-[#333] dark:text-gray-200 break-all"
      >{{ region.latex }}</code>
    </div>

    <div class="shrink-0 flex gap-1.5 px-3 py-2 border-t border-gray-200 dark:border-white/10">
      <button
        v-if="viewerStore.chatPackage"
        type="button"
        class="efv-card-btn bg-secondary text-white hover:bg-secondary-strong"
        @click="addToChat"
      >
        {{ $t('ask-in-chat') }}
      </button>
      <button
        v-if="viewerStore.explainFunction"
        type="button"
        class="efv-card-btn bg-accent-soft text-accent-ink hover:brightness-95"
        @click="explain"
      >
        {{ $t('explain') }}
      </button>
    </div>
  </div>
</template>
