<script setup lang="ts">
// The Navigator: one drawer for finding your way in the book.
//   Contents · Pages · Search · Notes
// Info, Share and Print (from "⋯") open in the same drawer with a way back.
// Docked beside the pages on wide screens (the pages reflow), over them on
// narrow ones.
import { computed, nextTick, ref, watch } from 'vue';
import { SIDEBAR_STATE } from '@/assets/utils/enums';
import { useDocumentStore } from '@/stores';
import { Search } from '../pdf-menu/pdf-menu-sidebar/items';
import { TOC } from '../pdf-modal/items';
import PageGrid from './PageGrid.vue';
import NotesPanel from './NotesPanel.vue';

const props = defineProps<{ docked: boolean }>();
const docStore = useDocumentStore();

const SECTIONS = [
  { state: SIDEBAR_STATE.TOC, label: 'contents' },
  { state: SIDEBAR_STATE.PAGES, label: 'pages' },
  { state: SIDEBAR_STATE.SEARCH, label: 'search' },
  { state: SIDEBAR_STATE.HIGHLIGHTS, label: 'notes' },
] as const;
// Share, Info and Print are cards under their top-bar buttons now; a stale
// state pointing at them (e.g. an old host call) shows the section list.
const DETAILS: Partial<Record<SIDEBAR_STATE, string>> = {};

const sections = computed(() =>
  SECTIONS.filter((s) => s.state !== SIDEBAR_STATE.TOC || docStore.toc.length > 0)
);
const open = computed(() => docStore.sidebarState !== SIDEBAR_STATE.NULL);
const detail = computed(() => DETAILS[docStore.sidebarState] ?? null);

// Where "back" from a detail view goes: the section the reader came from.
const lastSection = ref<SIDEBAR_STATE>(SIDEBAR_STATE.PAGES);
watch(
  () => docStore.sidebarState,
  (state) => {
    if (SECTIONS.some((s) => s.state === state)) lastSection.value = state;
  },
  { immediate: true }
);
const back = () =>
  (docStore.sidebarState =
    lastSection.value === SIDEBAR_STATE.TOC && !docStore.toc.length
      ? SIDEBAR_STATE.PAGES
      : lastSection.value);

const close = () => (docStore.sidebarState = SIDEBAR_STATE.NULL);

// Over the pages (narrow screens), going somewhere closes the drawer so the
// reader sees where they arrived. Search stays open: stepping through hits.
watch(
  () => docStore.scrollRequest?.seq,
  () => {
    if (!props.docked && open.value && docStore.sidebarState !== SIDEBAR_STATE.SEARCH) close();
  }
);

// Focus moves into the drawer when a section opens (the search field first).
const panel = ref<HTMLElement | null>(null);
watch(
  () => docStore.sidebarState,
  (state) => {
    if (state === SIDEBAR_STATE.NULL) return;
    nextTick(() => {
      const field = panel.value?.querySelector<HTMLElement>('input[name="search-pattern"]');
      (field ?? panel.value?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]'))?.focus();
    });
  }
);
</script>

<template>
  <aside
    v-if="open"
    ref="panel"
    data-efv-float
    class="flex flex-col w-[320px] max-w-[calc(100vw-24px)] bg-white dark:bg-[#1c1c1e] border-r border-black/[0.06] dark:border-white/[0.06]"
    :class="
      props.docked
        ? 'relative shrink-0 h-full'
        : 'absolute top-0 left-0 bottom-0 z-30 shadow-[8px_0_30px_rgba(0,0,0,0.2)]'
    "
    role="region"
    :aria-label="$t('navigator')"
  >
    <!-- Sections, or the way back from a detail view -->
    <div class="shrink-0 flex items-center gap-1 px-2.5 pt-2.5 pb-2">
      <template v-if="detail">
        <button
          type="button"
          class="size-8 inline-flex items-center justify-center rounded-[8px] text-[#3a3a3c] dark:text-gray-200 hover:bg-black/[0.06] dark:hover:bg-white/10"
          :aria-label="$t('back')"
          @click="back"
        >
          <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="none"><path d="M12.5 5L7.5 10l5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <h2 class="flex-1 text-[14px] font-semibold text-[#1d1d1f] dark:text-white">{{ $t(detail) }}</h2>
      </template>
      <div
        v-else
        class="flex-1 grid gap-0.5 p-0.5 rounded-[9px] bg-black/[0.05] dark:bg-white/[0.07]"
        :style="{ gridTemplateColumns: `repeat(${sections.length}, minmax(0, 1fr))` }"
        role="tablist"
      >
        <button
          v-for="section in sections"
          :key="section.state"
          type="button"
          role="tab"
          :aria-selected="docStore.sidebarState === section.state"
          class="h-7 px-1 rounded-[7px] text-[11.5px] font-medium tracking-[-0.01em] whitespace-nowrap overflow-hidden transition"
          :class="
            docStore.sidebarState === section.state
              ? 'bg-white dark:bg-[#3a3a3c] text-[#1d1d1f] dark:text-white shadow-[0_1px_3px_rgba(0,0,0,0.12)]'
              : 'text-[#6e6e73] dark:text-gray-400 hover:text-[#1d1d1f] dark:hover:text-white'
          "
          @click="docStore.sidebarState = section.state"
        >
          {{ $t(section.label) }}
        </button>
      </div>
      <button
        type="button"
        class="size-8 shrink-0 inline-flex items-center justify-center rounded-[8px] text-[#8e8e93] hover:text-[#1d1d1f] dark:hover:text-white hover:bg-black/[0.06] dark:hover:bg-white/10"
        :aria-label="$t('close')"
        @click="close"
      >
        <svg aria-hidden="true" width="11" height="11" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
      </button>
    </div>

    <div data-navigator-scroll class="flex-1 min-h-0 overflow-auto">
      <div v-if="docStore.sidebarState === SIDEBAR_STATE.TOC" class="px-2 pb-3">
        <TOC />
      </div>
      <PageGrid v-else-if="docStore.sidebarState === SIDEBAR_STATE.PAGES" />
      <div v-else-if="docStore.sidebarState === SIDEBAR_STATE.SEARCH" class="h-full px-2 py-2">
        <Search />
      </div>
      <NotesPanel v-else-if="docStore.sidebarState === SIDEBAR_STATE.HIGHLIGHTS" />
    </div>
  </aside>
</template>
