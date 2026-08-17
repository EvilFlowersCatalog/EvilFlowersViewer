<script setup lang="ts">
import { SIDEBAR_STATE } from '@/assets/utils/enums';
import { useDocumentStore } from '@/stores';
import { Info, Share, Search, Print } from './items';
import { TOC } from '@/components/pdf-viewer-page/pdf-modal/items';
import { nextTick, ref, watch } from 'vue';

const docStore = useDocumentStore();
const panelRef = ref<HTMLDivElement | null>(null);

// Move keyboard focus into the panel when it opens — prefer the first field so
// e.g. the search box is ready to type into.
watch(
  () => docStore.sidebarState,
  (state) => {
    if (state === SIDEBAR_STATE.NULL) return;
    nextTick(() => {
      const first = panelRef.value?.querySelector<HTMLElement>(
        'input, textarea, button, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });
  }
);

const sidebarTitles: Partial<Record<SIDEBAR_STATE, string>> = {
  [SIDEBAR_STATE.SEARCH]: 'search',
  [SIDEBAR_STATE.SHARE]: 'share',
  [SIDEBAR_STATE.INFO]: 'info',
  [SIDEBAR_STATE.PRINT]: 'print',
  [SIDEBAR_STATE.TOC]: 'table-of-content',
};
</script>

<template>
  <!-- Floating panel: absolutely positioned over the content, never pushes or resizes siblings -->
  <div
    v-if="docStore.sidebarState !== SIDEBAR_STATE.NULL"
    ref="panelRef"
    class="absolute top-3 left-1.5 bottom-3 w-[207px] flex flex-col bg-white dark:bg-[#1e1e1e] rounded-[5px] shadow-[2px_0px_8px_rgba(0,0,0,0.12)] z-10 overflow-hidden"
    role="region"
    :aria-label="$t(sidebarTitles[docStore.sidebarState] ?? docStore.sidebarState)"
  >
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-1 border-b border-gray-200 dark:border-white/10 shrink-0">
      <h2 class="text-[13px] font-medium uppercase text-[#333] dark:text-gray-200 tracking-[0.1px]">
        {{ $t(sidebarTitles[docStore.sidebarState] ?? docStore.sidebarState) }}
      </h2>
      <button
        @click="docStore.setSidebarState(SIDEBAR_STATE.NULL)"
        class="ml-auto text-gray-400 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors p-1 rounded-[5px] hover:bg-gray-100 dark:hover:bg-white/10"
        :aria-label="$t('close')"
      >
        <!-- Double-chevron left -->
        <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="none">
          <path d="M11 5L6 10L11 15M16 5L11 10L16 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Content (scrollable) -->
    <div class="flex-1 overflow-auto px-4 py-2">
      <Info   v-if="docStore.sidebarState === SIDEBAR_STATE.INFO" />
      <Share  v-if="docStore.sidebarState === SIDEBAR_STATE.SHARE" />
      <Search v-if="docStore.sidebarState === SIDEBAR_STATE.SEARCH" />
      <Print  v-if="docStore.sidebarState === SIDEBAR_STATE.PRINT" />
      <TOC    v-if="docStore.sidebarState === SIDEBAR_STATE.TOC" />
    </div>
  </div>
</template>
