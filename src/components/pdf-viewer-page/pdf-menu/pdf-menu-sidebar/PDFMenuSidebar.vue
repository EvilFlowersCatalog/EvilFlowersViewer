<script setup lang="ts">
import { SIDEBAR_STATE } from '@/assets/utils/enums';
import { useDocumentStore } from '@/stores';
import { Info, Share, Search, Print } from './items';
import { TOC } from '@/components/pdf-viewer-page/pdf-modal/items';

const docStore = useDocumentStore();

const sidebarTitles: Partial<Record<SIDEBAR_STATE, string>> = {
  [SIDEBAR_STATE.SEARCH]: 'search',
  [SIDEBAR_STATE.SHARE]: 'share',
  [SIDEBAR_STATE.INFO]: 'info',
  [SIDEBAR_STATE.PRINT]: 'print',
  [SIDEBAR_STATE.TOC]: 'table-of-content',
};
</script>

<template>
  <!-- Outer: transitions width with overflow hidden to slide in/out cleanly -->
  <div
    class="h-full overflow-hidden shrink-0 transition-all duration-300 z-10"
    :class="docStore.sidebarState === SIDEBAR_STATE.NULL ? 'w-0' : 'w-72'"
  >
    <!-- Inner: always 288px wide so content doesn't squish -->
    <div class="flex flex-col w-72 h-full bg-white dark:bg-[#252525] shadow-2xl">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-white/10 shrink-0">
        <h2
          v-if="docStore.sidebarState !== SIDEBAR_STATE.NULL"
          class="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400"
        >
          {{ $t(sidebarTitles[docStore.sidebarState] ?? docStore.sidebarState) }}
        </h2>
        <button
          @click="docStore.setSidebarState(SIDEBAR_STATE.NULL)"
          class="ml-auto text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-200 transition-colors p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"
          title="Close"
        >
          <!-- Double-chevron left -->
          <svg class="size-4" viewBox="0 0 20 20" fill="none">
            <path d="M11 5L6 10L11 15M16 5L11 10L16 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>

      <!-- Content (scrollable) -->
      <div class="flex-1 overflow-auto p-5">
        <Info   v-if="docStore.sidebarState === SIDEBAR_STATE.INFO" />
        <Share  v-if="docStore.sidebarState === SIDEBAR_STATE.SHARE" />
        <Search v-if="docStore.sidebarState === SIDEBAR_STATE.SEARCH" />
        <Print  v-if="docStore.sidebarState === SIDEBAR_STATE.PRINT" />
        <TOC    v-if="docStore.sidebarState === SIDEBAR_STATE.TOC" />
      </div>
    </div>
  </div>
</template>
