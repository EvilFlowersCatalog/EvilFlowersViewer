<script setup lang="ts">
import { useDocumentStore } from '@/stores';
import { ref, inject, computed, type Ref } from 'vue';
import { PDFPreview } from '.';

const isDark = inject<Ref<boolean>>('isDark', ref(false));
const barBg = computed(() => (isDark.value ? '#111111' : '#FFFFFF'));
const tabBg = computed(() => (isDark.value ? '#1A1A1A' : '#F3F4F6'));
const tabText = computed(() => (isDark.value ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.7)'));

const docStore = useDocumentStore();

const hidePreview = ref<boolean>(false);
const showCenterButton = ref<boolean>(false);
const startPage = ref<number>(1);
const endPage = ref<number>(1);

const togglePreview = () => {
  hidePreview.value = !hidePreview.value;
};

const centerPreview = async () => {
  if (docStore.activePage > endPage.value) {
    startPage.value = endPage.value + 1;
    endPage.value = docStore.activePage;
  }

  const previewContainer = document.getElementById('preview-container');
  const pageContainer = document.getElementById(
    `preview-page-container-${docStore.activePage}`
  );

  if (previewContainer && pageContainer) {
    const pageLeft = pageContainer.offsetLeft;
    const pageWidth = pageContainer.offsetWidth;
    const previewWidth = previewContainer.clientWidth;
    const scrollLeft = pageLeft - previewWidth / 2 + pageWidth / 2;
    previewContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }
};

const handleEmit = (show: boolean, start: number, end: number) => {
  if (showCenterButton.value !== show) showCenterButton.value = show;
  if (show) {
    if (startPage.value !== start) startPage.value = start;
    if (endPage.value !== end) endPage.value = end;
  }
};
</script>

<template>
  <div class="relative shrink-0 w-full" v-if="!docStore.isFullscreenMode">

    <!-- Floating toggle tab — right-anchored, sits above the bar -->
    <button
      @click="togglePreview"
      class="absolute right-4 -top-7 flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg transition-all duration-200 text-xs font-medium select-none group"
      :style="{ backgroundColor: tabBg, color: tabText }"
    >
      <svg
        class="size-3 transition-transform duration-300"
        :class="hidePreview ? '' : 'rotate-180'"
        viewBox="0 0 12 8"
        fill="none"
      >
        <path d="M1 7L6 2L11 7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span class="opacity-70 group-hover:opacity-100 transition-opacity">
        {{ hidePreview ? $t('show-bottom-bar') : $t('hide-bottom-bar') }}
      </span>
    </button>

    <!-- Preview strip — animated height -->
    <div
      class="w-full overflow-hidden transition-all duration-300 ease-in-out border-t"
      :class="[
        hidePreview ? 'h-0 opacity-0' : 'h-40 opacity-100',
        isDark ? 'border-white/10' : 'border-gray-200'
      ]"
      :style="{ backgroundColor: barBg }"
    >
      <PDFPreview @handleEmit="handleEmit" />
    </div>

    <!-- Center-page button (floating above bar) -->
    <Transition
      enter-active-class="transition-all duration-200"
      enter-from-class="opacity-0 translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-1"
    >
      <div v-if="showCenterButton && !hidePreview" class="absolute right-28 -top-7">
        <button
          @click="centerPreview"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-t-lg transition-all duration-200 text-xs font-medium hover:text-secondary"
          :style="{ backgroundColor: tabBg, color: tabText }"
        >
          <svg class="size-3.5" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.4"/>
            <path d="M10 2V5M10 15V18M2 10H5M15 10H18" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <span>{{ $t('center') }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
