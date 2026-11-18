<script setup lang="ts">
// Every page as a thumbnail, two per row. A thumbnail renders when it
// scrolls into the drawer (never all at once: that would fetch the whole file
// of a streamed document) and its bitmap is kept while the drawer is open.
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { useDocumentStore } from '@/stores';
import { BookmarkIcon } from '@/components/pdf-aids';

const docStore = useDocumentStore();
const grid = ref<HTMLElement | null>(null);
const THUMB_WIDTH = 132;

const pages = computed(() => Array.from({ length: docStore.totalPages }, (_, i) => i + 1));
const done = new Set<number>();
const inFlight = new Set<number>();
let observer: IntersectionObserver | null = null;

const renderThumb = async (canvas: HTMLCanvasElement, pageNumber: number) => {
  const pdf = toRaw(docStore.pdf) as PDFDocumentProxy | null;
  if (!pdf || done.has(pageNumber) || inFlight.has(pageNumber)) return;
  inFlight.add(pageNumber);
  try {
    const page = await pdf.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: THUMB_WIDTH / base.width });
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewport.width * ratio);
    canvas.height = Math.floor(viewport.height * ratio);
    canvas.style.aspectRatio = `${base.width} / ${base.height}`;
    await page.render({
      canvas,
      viewport,
      transform: ratio !== 1 ? [ratio, 0, 0, ratio, 0, 0] : undefined,
    }).promise;
    done.add(pageNumber);
  } catch {
    // a thumbnail that fails stays blank
  } finally {
    inFlight.delete(pageNumber);
  }
};

const observe = () => {
  observer?.disconnect();
  if (!grid.value) return;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const canvas = entry.target as HTMLCanvasElement;
        renderThumb(canvas, Number(canvas.dataset.thumb));
      }
    },
    { root: grid.value.closest('[data-navigator-scroll]'), rootMargin: '200px 0px' }
  );
  grid.value.querySelectorAll('canvas[data-thumb]').forEach((el) => observer!.observe(el));
};

// Open on the current page.
onMounted(async () => {
  await nextTick();
  observe();
  grid.value
    ?.querySelector(`[data-thumb-page="${docStore.activePage}"]`)
    ?.scrollIntoView({ block: 'center' });
});
watch(
  () => docStore.pdf,
  async () => {
    done.clear();
    await nextTick();
    observe();
  }
);
onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <div ref="grid" class="grid grid-cols-2 gap-x-3 gap-y-4 px-3 py-3">
    <button
      v-for="page in pages"
      :key="page"
      type="button"
      :data-thumb-page="page"
      class="group flex flex-col items-center gap-1.5 rounded-[8px] p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0077cc]"
      :aria-label="$t('page-short', { page: docStore.pageLabel(page) ?? page })"
      :aria-current="docStore.activePage === page ? 'page' : undefined"
      @click="docStore.goTo(page, 'thumbnail')"
    >
      <span
        class="relative w-full rounded-[4px] overflow-hidden bg-white transition-shadow"
        :class="
          docStore.activePage === page
            ? 'ring-[3px] ring-[#0077cc]'
            : 'ring-1 ring-black/10 group-hover:ring-black/25 dark:ring-white/15'
        "
      >
        <canvas :data-thumb="page" class="block w-full aspect-[1/1.414]" aria-hidden="true" />
        <BookmarkIcon
          v-if="docStore.isBookmarked(page)"
          class="absolute top-0 right-1.5 text-[#0077cc]"
          :filled="true"
          :width="10"
          :height="14"
        />
      </span>
      <span
        class="text-[11.5px] tabular-nums"
        :class="docStore.activePage === page ? 'font-semibold text-[#0077cc]' : 'text-[#6e6e73] dark:text-gray-400'"
      >
        {{ docStore.pageLabel(page) ?? page }}
      </span>
    </button>
  </div>
</template>
