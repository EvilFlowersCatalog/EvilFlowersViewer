<script setup lang="ts">
import { DESIRED_HEIGHT, MAX_VISIBLE_PAGE } from '@/assets/utils/constans';
import { useDocumentStore } from '@/stores';
import { computed, inject, onMounted, ref, toRaw, watch, type Ref } from 'vue';

const isDark = inject<Ref<boolean>>('isDark', ref(false));

// Data
const docStore = useDocumentStore();
const startPage = ref<number>(1);
const endPage = ref<number>(
  docStore.totalPages > MAX_VISIBLE_PAGE
    ? MAX_VISIBLE_PAGE
    : docStore.totalPages
);
const hold = ref<boolean>(false);
const pageNumbers = computed(() =>
  Array.from({ length: docStore.totalPages }, (_, i) => i + 1)
);
let pdf = toRaw(docStore.previewPdf);

const emit = defineEmits();

const isVisible = () => {
  const previewContainer = document.getElementById('preview-container');
  const activePageContainer = document.getElementById(
    `preview-page-container-${docStore.activePage}`
  );
  if (activePageContainer && previewContainer) {
    const { x, width } = activePageContainer.getBoundingClientRect();
    // Horizontally in view
    const canvasVisible = x - 20 > 0 && x + width < window.innerWidth - 20;

    // Emit to preview bar, for button visibility
    if (!canvasVisible)
      emit('handleEmit', true, startPage.value, endPage.value);
    else emit('handleEmit', false);
  }
};

const handleScroll = (event: Event) => {
  const target = event.target as HTMLDivElement;
  const isAtEnd =
    target.scrollLeft + target.clientWidth + 100 >= target.scrollWidth;

  // If we reached end, change start and end page value
  if (isAtEnd && endPage.value < docStore.totalPages && !hold.value) {
    // Set hold to True cuz we loaded next pages, we want it only once
    hold.value = true;

    startPage.value = endPage.value + 1;
    endPage.value = Math.min(
      endPage.value + MAX_VISIBLE_PAGE,
      docStore.totalPages
    );
  } else if (hold.value && !isAtEnd) {
    // If we leave end of scroll and the value is setted to true, reset
    hold.value = false;
  }

  // Check if active canvas is visible on preview
  isVisible();
};

const renderPage = async (numPage: number) => {
  if (!pdf) return;

  const page = await pdf.getPage(numPage);

  // Get viewport and set new desired scale for preview
  let viewport = page.getViewport({ scale: 1 });
  const desiredScale = DESIRED_HEIGHT / viewport.height;
  viewport = page.getViewport({ scale: desiredScale });

  // Create canvas
  const canvas = document.getElementById(
    `preview-canvas-${numPage}`
  ) as HTMLCanvasElement;
  if (canvas) {
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;

    const canvasContext = canvas.getContext('2d') as CanvasRenderingContext2D;
    // Render page content to the canvas
    await page.render({
      canvasContext,
      viewport,
    }).promise;
  }

  // Remove loader from canvas
  const loader = document.getElementById('preview-loader-' + numPage);
  if (loader) {
    loader.classList.add('hidden');
  }
};

const renderPreview = () => {
  // Render all pageNumbers and wait for all to complete
  for (let i = startPage.value; i <= endPage.value; i++) {
    renderPage(i);
  }
};

onMounted(() => {
  // On mount render preview
  renderPreview();
});

// Watch for pdf, and start/end value pages if changed, render
watch(
  () => [pdf, startPage.value, endPage.value],
  () => renderPreview()
);

// Watch for totalPages change, if changed, update endPage
watch(
  () => docStore.totalPages,
  (totalPages) => {
    endPage.value =
      totalPages > MAX_VISIBLE_PAGE ? MAX_VISIBLE_PAGE : totalPages;
  },
  { immediate: true } // Run immediately in case totalPages is already defined
);

// If active page change, check visibility
watch(
  () => docStore.activePage,
  (activePage) => {
    if (activePage > endPage.value) {
      startPage.value = endPage.value + 1;
      endPage.value = Math.min(
        activePage + MAX_VISIBLE_PAGE,
        docStore.totalPages
      );
    }
    isVisible();
  }
);

// If pdf change, update pdf
watch(
  () => docStore.previewPdf,
  () => {
    pdf = toRaw(docStore.previewPdf);
  }
);
</script>

<template>
  <div
    id="preview-container"
    class="relative h-full flex items-start gap-[27px] px-4 py-[2px] overflow-x-auto overflow-y-hidden hide-scrollbar"
    @scroll="handleScroll"
  >
    <!-- Preview for loop -->
    <div
      v-for="key in pageNumbers"
      :key="key"
      :id="`preview-page-container-${key}`"
      class="relative shrink-0 flex flex-col w-[92px]"
      :class="[key > endPage && 'hidden']"
    >
      <!-- Loader -->
      <div
        :id="`preview-loader-${key}`"
        class="absolute top-0 left-0 w-full bg-secondary animate-pulse border-4 border-transparent pointer-events-none"
        :style="{ height: `${DESIRED_HEIGHT}px` }"
      ></div>

      <!-- Canvas -->
      <canvas
        :id="`preview-canvas-${key}`"
        class="w-[92px] cursor-pointer shadow-sm rounded-[2px]"
        :class="[
          docStore.activePage === key
            ? 'ring-[1.5px] ring-[#0077CC]'
            : isDark ? 'ring-1 ring-white/10' : 'ring-1 ring-gray-200',
        ]"
        :style="{ height: `${DESIRED_HEIGHT}px` }"
        @click="docStore.setActivePage(key)"
      >
      </canvas>

      <!-- Page number -->
      <span
        class="block text-center text-[11px] leading-4 select-none tabular-nums h-4 mt-0.5"
        :class="docStore.activePage === key
          ? 'font-medium text-[#0077CC]'
          : isDark ? 'font-normal text-white/60' : 'font-normal text-[#333]'"
      >
        {{ key }}
      </span>
    </div>
  </div>
</template>
