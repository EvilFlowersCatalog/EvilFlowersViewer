<script setup lang="ts">
import { useDocumentStore } from '@/stores';
import { ref, inject, computed, type Ref } from 'vue';
import { PDFPreview } from '.';
import { SIDEBAR_STATE } from '@/assets/utils/enums';

const isDark = inject<Ref<boolean>>('isDark', ref(false));
const barBg = computed(() => (isDark.value ? '#111111' : '#FFFFFF'));

const docStore = useDocumentStore();

const hidePreview = ref<boolean>(false);
const inputValue = ref<string>('');

const togglePreview = () => {
  hidePreview.value = !hidePreview.value;
};

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  if (
    /^\d*$/.test(value) &&
    Number(value) <= docStore.totalPages &&
    Number(value) > 0
  )
    inputValue.value = value;
  else if (Number(value) === 0) target.value = '';
  else target.value = inputValue.value;
};

const handleKeyDown = (event: KeyboardEvent) => {
  event.stopPropagation();
  if (event.key === 'Enter' && inputValue.value) {
    docStore.setActivePage(Number(inputValue.value));
    inputValue.value = '';
    (event.target as HTMLInputElement).value = '';
  }
};

const toggleSidebar = (state: SIDEBAR_STATE) => {
  docStore.setSidebarState(
    docStore.sidebarState === state ? SIDEBAR_STATE.NULL : state
  );
};

const btn = computed(() => {
  const base = 'w-7 h-7 flex items-center justify-center rounded transition-colors';
  return isDark.value
    ? `${base} text-white/70 hover:text-white hover:bg-white/10`
    : `${base} text-gray-500 hover:text-gray-900 hover:bg-black/5`;
});
</script>

<template>
  <div class="relative shrink-0 w-full" v-if="!docStore.isFullscreenMode">

    <!-- Odporúčania chip — floats above the bar -->
    <button
      @click="toggleSidebar(SIDEBAR_STATE.RECOMMENDATIONS)"
      class="absolute flex items-center text-xs font-medium text-gray-700 z-10"
      style="right: 10px; top: -31px; width: 108px; height: 24px; padding: 0 5px 0 7px; gap: 6px; border-radius: 4px; background: #E6F3FF; box-shadow: 0 4px 12px 0 rgba(0,0,0,0.10);"
    >
      <span class="flex-1 text-left truncate">{{ $t('recommendations') }}</span>
      <svg class="shrink-0" width="14" height="14" viewBox="0 0 20 20" fill="none">
        <path d="M5 2H15C15.5523 2 16 2.44772 16 3V18L10 15L4 18V3C4 2.44772 4.44772 2 5 2Z" stroke="#1E6FBA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <!-- Row 1: hide toggle (center) + zoom (right) -->
    <div
      class="flex items-center h-8 border-t px-2"
      :class="isDark ? 'border-white/10' : 'border-gray-200'"
      :style="{ backgroundColor: barBg }"
    >
      <!-- Left spacer -->
      <div class="flex-1" />

      <!-- Center: hide/show toggle -->
      <button @click="togglePreview" :class="btn">
        <svg
          class="size-4 transition-transform duration-300"
          :class="hidePreview ? '' : 'rotate-180'"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M4 13L10 7L16 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Right: zoom + - -->
      <div class="flex-1 flex items-center justify-end gap-0.5">
        <button
          @click="docStore.zoomIn"
          :class="[btn, docStore.scale >= 3 ? 'opacity-30 cursor-not-allowed' : '']"
          :disabled="docStore.scale >= 3"
          class="text-base font-semibold"
        >+</button>
        <button
          @click="docStore.zoomOut"
          :class="[btn, docStore.scale <= 0.25 ? 'opacity-30 cursor-not-allowed' : '']"
          :disabled="docStore.scale <= 0.25"
          class="text-base font-semibold"
        >−</button>
      </div>
    </div>

    <!-- Row 2: pagination (center) -->
    <div
      class="flex items-center justify-center h-8 gap-2"
      :style="{ backgroundColor: barBg }"
    >
      <button
        @click="docStore.previousPage"
        :class="[btn, docStore.activePage === 1 ? 'opacity-30 cursor-not-allowed' : '']"
        :disabled="docStore.activePage === 1"
      >
        <svg class="size-3" viewBox="0 0 8 12" fill="none">
          <path d="M7 1L2 6L7 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <div class="flex items-center gap-1">
        <input
          name="search-page"
          class="w-10 h-6 rounded text-center text-xs font-medium outline-none focus:border-secondary transition-colors tabular-nums"
          :class="isDark
            ? 'bg-white/10 text-white border border-white/20 placeholder:text-white/50'
            : 'bg-black/5 text-gray-800 border border-black/15 placeholder:text-gray-400'"
          type="text"
          :placeholder="String(docStore.activePage)"
          @keydown="handleKeyDown"
          @input="handleInputChange"
        />
        <span class="text-xs select-none tabular-nums" :class="isDark ? 'text-white/40' : 'text-gray-400'">/ {{ docStore.totalPages }}</span>
      </div>

      <button
        @click="docStore.nextPage"
        :class="[btn, docStore.activePage === docStore.totalPages ? 'opacity-30 cursor-not-allowed' : '']"
        :disabled="docStore.activePage === docStore.totalPages"
      >
        <svg class="size-3" viewBox="0 0 8 12" fill="none">
          <path d="M1 1L6 6L1 11" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- Row 3: thumbnail strip -->
    <div
      class="w-full overflow-hidden transition-all duration-300 ease-in-out"
      :class="hidePreview ? 'h-0 opacity-0' : 'h-[120px] opacity-100'"
      :style="{ backgroundColor: barBg }"
    >
      <div class="h-full overflow-x-auto overflow-y-hidden thin-scrollbar">
        <PDFPreview />
      </div>
    </div>

  </div>
</template>

<style scoped>
.thin-scrollbar::-webkit-scrollbar {
  height: 3px;
}
.thin-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.thin-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 2px;
}
.thin-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.15) transparent;
}
</style>
