<script setup lang="ts">
// Contents: the outline ("Chapters") and, when the host can list them, every
// figure, table and equation of the copy ("Figures", IP-018 Phase 8).
import { computed, ref, watch } from 'vue';
import { MODAL_CONTENT } from '@/assets/utils/enums';
import type { IRegion, ITOCItem } from '@/assets/utils/interfaces';
import { useAssistantStore, useDocumentStore, useViewerStore } from '@/stores';
import { TOCItem } from '.';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();

// The sidebar panel stays open while navigating with it; only the modal
// (which covers the page) closes so the target is visible.
const closePanels = () => docStore.setModalContent(MODAL_CONTENT.NULL);

const handleItemClick = (page: number) => {
  if (page === -1) return;
  docStore.activePage = page;
  closePanels();
};

const handleToggleExpand = (item: ITOCItem) => {
  item.isExpanded = !item.isExpanded;
};

const hasFigures = computed(() => !!viewerStore.regionPackage?.getAllRegionsFunc);
const tab = ref<'chapters' | 'figures'>('chapters');
const kind = ref<'all' | IRegion['kind']>('all');

watch(
  tab,
  (value) => {
    if (value === 'figures') assistantStore.loadAllRegions();
  },
  { immediate: true }
);

const kinds = computed(() => {
  const present = new Set(assistantStore.listedRegions.map((r) => r.kind));
  return (['figure', 'table', 'equation'] as const).filter((k) => present.has(k));
});

const regions = computed(() =>
  assistantStore.listedRegions.filter((r) => kind.value === 'all' || r.kind === kind.value)
);

const label = (region: IRegion) =>
  region.printedCaption ||
  region.caption ||
  region.description ||
  (region.markdown ?? '').split('\n', 1)[0].replace(/\|/g, ' ').trim() ||
  region.latex ||
  '';

const openRegion = (region: IRegion) => {
  assistantStore.goToRegion(region);
  closePanels();
};

const kindIcon: Record<IRegion['kind'], string> = {
  figure: 'M3 5h14v10H3zM3 12l4-4 4 4 2-2 4 4',
  table: 'M3 4h14v12H3zM3 8h14M3 12h14M8 4v12',
  equation: 'M5 5h9l-6 5 6 5H5',
};
</script>

<template>
  <div class="w-full flex flex-col gap-2">
    <div v-if="hasFigures" class="flex gap-1 p-0.5 rounded-[6px] bg-gray-100 dark:bg-white/5" role="tablist">
      <button
        v-for="name in ['chapters', 'figures'] as const"
        :key="name"
        type="button"
        role="tab"
        :aria-selected="tab === name"
        class="flex-1 h-6 rounded-[5px] text-[11px] font-medium transition"
        :class="
          tab === name
            ? 'bg-white dark:bg-[#2a2a2a] text-[#333] dark:text-gray-100 shadow-sm'
            : 'text-efv-muted hover:text-[#333] dark:hover:text-gray-200'
        "
        @click="tab = name"
      >
        {{ $t(`toc-tab-${name}`) }}
      </button>
    </div>

    <div v-if="tab === 'chapters'" class="w-full overflow-auto">
      <TOCItem
        v-for="(item, i) in docStore.toc"
        :key="`${item.title}-${i}`"
        :item="item"
        @item-click="handleItemClick"
        @toggle-expand="handleToggleExpand"
      />
    </div>

    <div v-else class="flex flex-col gap-1">
      <div v-if="kinds.length > 1" class="flex flex-wrap gap-1">
        <button
          v-for="name in ['all', ...kinds] as const"
          :key="name"
          type="button"
          class="h-5 px-2 rounded-full text-[10px] font-medium transition"
          :class="kind === name ? 'bg-secondary text-white' : 'bg-accent-soft text-accent-ink hover:brightness-95'"
          @click="kind = name"
        >
          {{ name === 'all' ? $t('toc-kind-all') : $t(`region-${name}`) }}
        </button>
      </div>

      <p v-if="assistantStore.allRegionsLoading && !regions.length" class="text-[11px] text-efv-muted px-1 py-2">{{ $t('loading') }}</p>
      <p v-else-if="!regions.length" class="text-[11px] text-efv-muted px-1 py-2">{{ $t('toc-no-figures') }}</p>

      <button
        v-for="region in regions"
        :key="region.id"
        type="button"
        class="w-full flex items-start gap-2 px-1.5 py-1.5 rounded-[5px] text-left hover:bg-gray-100 dark:hover:bg-white/10 transition"
        @click="openRegion(region)"
      >
        <svg aria-hidden="true" class="size-3.5 mt-[1px] shrink-0 text-accent-ink" viewBox="0 0 20 20" fill="none">
          <path :d="kindIcon[region.kind]" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
        <span class="flex-1 min-w-0">
          <span class="block text-[11px] leading-[15px] text-[#333] dark:text-gray-200 line-clamp-2">
            {{ label(region) || $t(`region-${region.kind}`) }}
          </span>
          <span v-if="region.printedCaption && region.description" class="block text-[10px] leading-[13px] text-efv-muted line-clamp-1">
            {{ region.description }}
          </span>
        </span>
        <span class="shrink-0 text-[10px] text-efv-muted tabular-nums">{{ region.page }}</span>
      </button>
    </div>
  </div>
</template>
