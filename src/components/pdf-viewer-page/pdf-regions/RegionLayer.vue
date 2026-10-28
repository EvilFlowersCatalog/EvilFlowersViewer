<script setup lang="ts">
// Figures, tables and equations the catalog extracted from this page. The
// region under the pointer gets an outline and a corner badge; the badge opens
// a card with what the catalog knows plus chat/explain actions. Hit-testing
// runs on pointer position, so text selection underneath keeps working.
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useAssistantStore, useDocumentStore, useViewerStore } from '@/stores';
import type { IRegion } from '@/assets/utils/interfaces';
import { boxContains, boxStyle, usePagePointer, useStickyHover } from '../usePageHover';
import RegionCard from './RegionCard.vue';

const props = defineProps<{
  pageBodyRef: HTMLDivElement | null;
  canvasRef: HTMLCanvasElement | null;
}>();

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();

const pageBody = computed(() => props.pageBodyRef);
const pointer = usePagePointer(pageBody);

const regions = computed<IRegion[]>(() => assistantStore.regionsByPage.get(docStore.activePage) ?? []);

// Smallest region under the pointer wins, so an equation inside a figure is reachable.
const hitId = computed(() => {
  const point = pointer.value;
  if (!point) return null;
  const hits = regions.value.filter((r) => boxContains(r.bbox, point));
  hits.sort((a, b) => (a.bbox.x1 - a.bbox.x0) * (a.bbox.y1 - a.bbox.y0) - (b.bbox.x1 - b.bbox.x0) * (b.bbox.y1 - b.bbox.y0));
  return hits[0]?.id ?? null;
});

const hover = useStickyHover(hitId);
const active = computed(() => regions.value.find((r) => r.id === hover.activeId.value) ?? null);

// A chat citation focuses a region: open its card once its page is shown.
const flashId = ref<string | null>(null);
let flashTimer: ReturnType<typeof setTimeout> | null = null;
watch(
  () => [assistantStore.focusedRegionId, regions.value] as const,
  ([id]) => {
    if (!id || !regions.value.some((r) => r.id === id)) return;
    hover.open(id);
    flashId.value = id;
    assistantStore.focusedRegionId = null;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (flashId.value = null), 1600);
  },
  { immediate: true }
);
onBeforeUnmount(() => flashTimer && clearTimeout(flashTimer));

watch(
  () => docStore.activePage,
  (page) => {
    // Keep a card that a citation just opened on this page.
    if (!flashId.value || !regions.value.some((r) => r.id === flashId.value)) hover.close();
    assistantStore.loadRegions(page);
  },
  { immediate: true }
);

// Cards on the right half of the page open to the badge's left.
const cardSide = (region: IRegion) => (region.bbox.x1 > 0.55 ? 'left' : 'right');

const kindIcon: Record<IRegion['kind'], string> = {
  figure: 'M3 5h14v10H3zM3 12l4-4 4 4 2-2 4 4',
  table: 'M3 4h14v12H3zM3 8h14M3 12h14M8 4v12',
  equation: 'M5 5h9l-6 5 6 5H5',
};
</script>

<template>
  <div v-if="viewerStore.regionPackage" class="absolute inset-0 z-[6] pointer-events-none">
    <div
      v-for="region in regions"
      :key="region.id"
      class="absolute rounded-[3px] transition-[box-shadow,background-color] duration-150"
      :class="
        flashId === region.id
          ? 'efv-region-flash'
          : active?.id === region.id
            ? 'shadow-[0_0_0_2px_var(--efv-primary)] bg-[rgba(0,119,204,0.06)]'
            : ''
      "
      :style="boxStyle(region.bbox)"
    >
      <!-- Corner badge (+ its card, as a child so hovering the card keeps it open) -->
      <div
        v-if="active?.id === region.id"
        class="absolute -top-2.5 -right-2.5 pointer-events-auto"
        @mouseenter="hover.holdEnter"
        @mouseleave="hover.holdLeave"
      >
        <button
          type="button"
          class="flex items-center gap-1 h-6 pl-1.5 pr-2 rounded-full bg-secondary text-white text-[10px] font-medium shadow-[0_2px_6px_rgba(0,0,0,0.25)]"
          :aria-expanded="hover.cardOpen.value"
          :aria-label="$t(`region-${region.kind}`)"
          @click="hover.togglePin"
        >
          <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
            <path :d="kindIcon[region.kind]" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
          {{ $t(`region-${region.kind}`) }}
        </button>

        <RegionCard
          v-if="hover.cardOpen.value"
          :region="region"
          :canvas-ref="canvasRef"
          class="absolute top-7"
          :class="cardSide(region) === 'right' ? 'left-0' : 'right-0'"
          @close="hover.close"
        />
      </div>
    </div>
  </div>
</template>
