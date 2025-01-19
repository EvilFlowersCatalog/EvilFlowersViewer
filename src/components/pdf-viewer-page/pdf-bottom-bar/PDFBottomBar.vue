<script setup lang="ts">
import { useDocumentStore } from '@/stores';
import {
  AkTriangleLeftFill,
  AkTriangleRightFill,
  AkTriangleUpFill,
  AkTriangleDownFill,
  FaSquarePlus,
  FaSquareMinus,
  MdRoundCenterFocusStrong,
} from '@kalimahapps/vue-icons';
import { ref } from 'vue';
import { DEFAULT_PAGE } from '@/assets/utils/constans';
import { PDFPreview } from '.';
import ToolTip from '@/components/pdf-aids/ToolTip.vue';

// Data
const docStore = useDocumentStore();

const hidePreview = ref<boolean>(false);
const showButton = ref<boolean>(false);
const startPage = ref<number>(DEFAULT_PAGE);
const endPage = ref<number>(DEFAULT_PAGE);
const inputValue = ref<string>('');

const togglePreview = () => {
  hidePreview.value = !hidePreview.value;
};

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;

  // Check if it's valid and less than total pages
  if (
    /^\d*$/.test(value) &&
    Number(value) <= docStore.totalPages &&
    Number(value) > 0
  )
    inputValue.value = value;
  // Check if value is 0 or empty, set to empty
  else if (Number(value) === 0) target.value = '';
  // If it's not a valid number reset
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

    // Center the active canvas within the container
    const scrollLeft = pageLeft - previewWidth / 2 + pageWidth / 2;
    previewContainer.scrollTo({
      left: scrollLeft,
      behavior: 'smooth',
    });
  }
};

const handleEmit = (show: boolean, start: number, end: number) => {
  // Set value to show button
  if (showButton.value !== show) showButton.value = show;
  // Only if activ canvas is hidden set numbers
  if (show) {
    if (startPage.value !== start) startPage.value = start;
    if (endPage.value !== end) endPage.value = end;
  }
};
</script>

<template>
  <div
    class="relative w-full flex flex-col bg-primary px-4 py-2 gap-2 transition-height duration-200"
    :class="
      docStore.isFullscreenMode ? 'h-[40px]' : hidePreview ? 'h-[75px]' : 'h-64'
    "
  >
    <!-- Closing preview button -->
    <button
      v-if="!docStore.isFullscreenMode"
      class="w-fit mx-auto"
      @click="togglePreview"
    >
      <ToolTip v-if="hidePreview" position="top" :text="$t('show-bottom-bar')">
        <AkTriangleUpFill class="icon" />
      </ToolTip>
      <ToolTip v-else position="top" :text="$t('hide-bottom-bar')">
        <AkTriangleDownFill class="icon hover:text-secondary" />
      </ToolTip>
    </button>

    <!-- Pagination -->
    <div class="flex w-full justify-center items-center gap-2">
      <span class="flex-1"></span>

      <!-- Previous page button -->
      <ToolTip position="top" :text="$t('previous-page')">
        <button @click="docStore.previousPage">
          <AkTriangleLeftFill
            :class="
              docStore.activePage === 1
                ? 'disabled-icon'
                : 'icon hover:text-secondary'
            "
          />
        </button>
      </ToolTip>

      <!-- Input page -->
      <input
        name="search-page"
        class="w-28 rounded-md px-2 outline-none text-center"
        type="text"
        :placeholder="docStore.activePage + ' / ' + docStore.totalPages"
        @keydown="handleKeyDown"
        @input="handleInputChange"
      />

      <!-- Next page button -->
      <ToolTip position="top" :text="$t('next-page')">
        <button @click="docStore.nextPage">
          <AkTriangleRightFill
            :class="
              docStore.activePage === docStore.totalPages
                ? 'disabled-icon'
                : 'icon hover:text-secondary'
            "
          />
        </button>
      </ToolTip>
      <span class="flex-1"></span>
    </div>

    <!-- Zooming -->
    <div class="absolute flex gap-2 top-2 right-2">
      <ToolTip position="left" :text="$t('zoom-in')">
        <button @click="docStore.zoomIn">
          <FaSquarePlus
            :class="
              docStore.scale === 3
                ? 'disabled-icon'
                : 'icon hover:text-secondary'
            "
          />
        </button>
      </ToolTip>
      <ToolTip position="left" :text="$t('zoom-out')">
        <button @click="docStore.zoomOut">
          <FaSquareMinus
            :class="
              docStore.scale === 0.25
                ? 'disabled-icon'
                : 'icon hover:text-secondary'
            "
          />
        </button>
      </ToolTip>
    </div>

    <!-- Centering button -->
    <div
      v-if="showButton && !docStore.isFullscreenMode"
      class="absolute flex -top-16 right-2 p-2 pb-0.5 z-30 bg-primary rounded-md"
    >
      <ToolTip position="left" :text="$t('center')">
        <button @click="centerPreview">
          <MdRoundCenterFocusStrong class="icon size-9" />
        </button>
      </ToolTip>
    </div>

    <!-- Preview -->
    <PDFPreview @handleEmit="handleEmit" />
  </div>
</template>
