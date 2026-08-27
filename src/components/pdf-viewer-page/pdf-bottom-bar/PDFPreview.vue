<script setup lang="ts">
import { DESIRED_HEIGHT, MAX_VISIBLE_PAGE } from '@/assets/utils/constans';
import { useDocumentStore } from '@/stores';
import { BookmarkIcon } from '@/components/pdf-aids';
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
// Which thumbnails have finished painting (drives the loader overlay). Kept in
// state instead of toggling a DOM node by id, so multiple viewers can coexist.
const rendered = ref<Record<number, boolean>>({});
// Per-page canvas elements, collected via function refs (no getElementById).
const canvasRefs = new Map<number, HTMLCanvasElement>();
let pdf = toRaw(docStore.previewPdf);

const setCanvasRef = (el: unknown, key: number) => {
  if (el) canvasRefs.set(key, el as HTMLCanvasElement);
  else canvasRefs.delete(key);
};

const handleScroll = (event: Event) => {
  const target = event.target as HTMLDivElement;
  const isAtEnd =
    target.scrollLeft + target.clientWidth + 100 >= target.scrollWidth;

  // If we reached the end, reveal the next window of pages (once per arrival).
  if (isAtEnd && endPage.value < docStore.totalPages && !hold.value) {
    hold.value = true;
    startPage.value = endPage.value + 1;
    endPage.value = Math.min(
      endPage.value + MAX_VISIBLE_PAGE,
      docStore.totalPages
    );
  } else if (hold.value && !isAtEnd) {
    hold.value = false;
  }
};

const renderPage = async (numPage: number) => {
  if (!pdf) return;

  const page = await pdf.getPage(numPage);

  // Scale the page down to the fixed thumbnail height.
  let viewport = page.getViewport({ scale: 1 });
  const desiredScale = DESIRED_HEIGHT / viewport.height;
  viewport = page.getViewport({ scale: desiredScale });

  const canvas = canvasRefs.get(numPage);
  if (!canvas) return;

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  // Render page content to the canvas (pdf.js v6: pass the canvas element).
  await page.render({ canvas, viewport }).promise;

  rendered.value[numPage] = true;
};

const renderPreview = () => {
  for (let i = startPage.value; i <= endPage.value; i++) {
    renderPage(i);
  }
};

onMounted(() => {
  renderPreview();
});

// Re-render when the source or the visible window changes.
watch(
  () => [pdf, startPage.value, endPage.value],
  () => renderPreview()
);

// Keep the visible window in sync with the page count.
watch(
  () => docStore.totalPages,
  (totalPages) => {
    endPage.value =
      totalPages > MAX_VISIBLE_PAGE ? MAX_VISIBLE_PAGE : totalPages;
  },
  { immediate: true }
);

// Expand the window so the active page's thumbnail is always available.
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
  }
);

watch(
  () => docStore.previewPdf,
  () => {
    pdf = toRaw(docStore.previewPdf);
  }
);
</script>

<template>
  <div
    class="relative h-full flex items-start gap-[27px] px-4 py-[2px] overflow-x-auto overflow-y-hidden hide-scrollbar"
    role="group"
    :aria-label="$t('thumbnails')"
    @scroll="handleScroll"
  >
    <!-- Preview for loop -->
    <div
      v-for="key in pageNumbers"
      :key="key"
      class="relative shrink-0 flex flex-col w-[92px]"
      :class="[key > endPage && 'hidden']"
    >
      <!-- Loader -->
      <div
        v-if="!rendered[key]"
        class="absolute top-0 left-0 w-full bg-secondary animate-pulse border-4 border-transparent pointer-events-none"
        :style="{ height: `${DESIRED_HEIGHT}px` }"
      ></div>

      <!-- Canvas — acts as a button so it is keyboard reachable -->
      <canvas
        :ref="(el) => setCanvasRef(el, key)"
        class="w-[92px] cursor-pointer shadow-sm rounded-[2px]"
        :class="[
          docStore.activePage === key
            ? 'ring-[1.5px] ring-secondary'
            : isDark ? 'ring-1 ring-white/10' : 'ring-1 ring-gray-200',
        ]"
        :style="{ height: `${DESIRED_HEIGHT}px` }"
        role="button"
        tabindex="0"
        :aria-label="`${$t('page')} ${key}`"
        :aria-current="docStore.activePage === key ? 'page' : undefined"
        @click="docStore.activePage = key"
        @keydown.enter.prevent="docStore.activePage = key"
        @keydown.space.prevent="docStore.activePage = key"
      >
      </canvas>

      <!-- Bookmark flag — indicator only (the canvas underneath still handles
           navigation), so a bookmarked page is recognisable while scrolling
           the strip. -->
      <span
        v-if="docStore.isBookmarked(key)"
        class="absolute top-[0px] right-[8px] w-[15px] h-[15px] flex items-center justify-center rounded-[4px] pointer-events-none"
        :aria-label="`${$t('bookmarked-page')}: ${key}`"
      >
        <BookmarkIcon filled :width="8" :height="10" />
      </span>

      <!-- Page number -->
      <span
        class="block text-center text-[11px] leading-4 select-none tabular-nums h-4 mt-0.5"
        :class="docStore.activePage === key
          ? 'font-medium text-secondary'
          : isDark ? 'font-normal text-white/60' : 'font-normal text-[#333]'"
      >
        {{ key }}
      </span>
    </div>
  </div>
</template>
