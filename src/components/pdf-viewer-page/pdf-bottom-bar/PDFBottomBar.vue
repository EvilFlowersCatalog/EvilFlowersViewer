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

const handleBlur = (event: FocusEvent) => {
  if (inputValue.value) {
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

const iconBtn = computed(() => {
  const base = 'w-[18px] h-[18px] flex items-center justify-center rounded transition-colors';
  return isDark.value
    ? `${base} text-white/70 hover:text-white hover:bg-white/10`
    : `${base} text-gray-500 hover:text-gray-700 hover:bg-black/5`;
});

const zoomBtnClass = (disabled: boolean) => {
  const base = 'w-4 h-4 flex items-center justify-center rounded-[4px] transition-colors shadow-[inset_0px_1px_3px_rgba(0,0,0,0.25)]';
  const dis = disabled ? ' opacity-30 cursor-not-allowed' : '';
  return isDark.value
    ? `${base} text-white bg-white/15${dis}`
    : `${base} text-[#1E6FBA] bg-[#e6f3ff]${dis}`;
};
</script>

<template>
  <div
    class="relative shrink-0 w-full flex flex-col items-center px-5 pb-4"
    :style="{ backgroundColor: barBg, boxShadow: '3px -1px 2px rgba(0,0,0,0.15)' }"
    v-if="!docStore.isFullscreenMode"
  >
    <!-- Recommendations chip — floats above the bar -->
    <button
      @click="toggleSidebar(SIDEBAR_STATE.RECOMMENDATIONS)"
      class="absolute flex items-center text-xs font-normal text-black z-10"
      style="right: 10px; top: -31px; width: 108px; height: 24px; padding: 0 5px 0 7px; gap: 6px; border-radius: 4px; background: #E6F3FF; box-shadow: 0 4px 6px 0 rgba(0,0,0,0.10);"
    >
      <span class="flex-1 text-left truncate">{{ $t('recommendations') }}</span>
      <!-- TbBulb lightbulb icon -->
      <svg class="shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E6FBA" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12h1m8 -9v1m8 8h1m-15.4 -6.4l.7 .7m12.1 -.7l-.7 .7" />
        <path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3" />
        <path d="M9.7 17l4.6 0" />
      </svg>
    </button>

    <!-- Zoom buttons — absolutely positioned top-right -->
    <div class="absolute right-[6px] top-[8px] flex gap-[3px]">
      <button
        @click="docStore.zoomIn"
        :class="zoomBtnClass(docStore.scale >= 3)"
        :disabled="docStore.scale >= 3"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M7 2v10M2 7h10"/>
        </svg>
      </button>
      <button
        @click="docStore.zoomOut"
        :class="zoomBtnClass(docStore.scale <= 0.25)"
        :disabled="docStore.scale <= 0.25"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <path d="M2 7h10"/>
        </svg>
      </button>
    </div>

    <!-- Controls: chevron toggle + pagination -->
    <div class="relative w-full flex flex-col items-center">
      <!-- Chevron (collapse/expand thumbnail strip) -->
      <button @click="togglePreview" :class="iconBtn">
        <svg
          class="w-[18px] h-[18px] transition-transform duration-300"
          :class="hidePreview ? '' : 'rotate-180'"
          viewBox="0 0 20 20"
          fill="none"
        >
          <path d="M4 13L10 7L16 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <!-- Pagination row -->
      <div class="flex items-center gap-2 h-5 mt-[3px]">
        <button
          @click="docStore.previousPage"
          :class="[iconBtn, docStore.activePage === 1 ? 'opacity-30 cursor-not-allowed' : '']"
          :disabled="docStore.activePage === 1"
        >
          <svg class="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
            <path d="M13 4L7 10L13 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="flex items-center gap-1">
          <input
            name="search-page"
            class="w-[37px] h-5 rounded-[4px] text-center text-sm font-light outline-none tabular-nums transition-colors"
            :class="isDark
              ? 'bg-white/10 text-white shadow-[inset_0px_1px_3px_rgba(0,0,0,0.4)] placeholder:text-white/50'
              : 'bg-[#f5f7fa] text-[#333] shadow-[inset_0px_1px_3px_rgba(0,0,0,0.25)] placeholder:text-gray-400'"
            type="text"
            :placeholder="String(docStore.activePage)"
            @keydown="handleKeyDown"
            @input="handleInputChange"
            @blur="handleBlur"
          />
          <span
            class="text-sm font-light select-none tabular-nums"
            :class="isDark ? 'text-white/40' : 'text-[#333]'"
          >/ {{ docStore.totalPages }}</span>
        </div>

        <button
          @click="docStore.nextPage"
          :class="[iconBtn, docStore.activePage === docStore.totalPages ? 'opacity-30 cursor-not-allowed' : '']"
          :disabled="docStore.activePage === docStore.totalPages"
        >
          <svg class="w-[18px] h-[18px]" viewBox="0 0 20 20" fill="none">
            <path d="M7 4L13 10L7 16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Thumbnail strip -->
    <div
      class="w-full overflow-hidden transition-all duration-300 ease-in-out"
      :class="hidePreview ? 'h-0 opacity-0 mt-0' : 'h-[142px] opacity-100 mt-4'"
    >
      <PDFPreview />
    </div>
  </div>
</template>
