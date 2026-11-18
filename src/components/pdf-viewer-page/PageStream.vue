<script setup lang="ts">
// The continuous view: every page in one scroll container, laid out at its
// real size (estimated from page 1 until a page reports its own). Only pages
// near the view are mounted (PageView); the rest are empty slots of the right
// size, so the scrollbar is honest and memory stays bounded.
//
// Who moves whom (docs/diagrams/state-active-page.puml):
//  · scrolling reports the active page (setActiveFromScroll: no history);
//  · a jump (docStore.scrollRequest) scrolls here, and scroll reports are
//    ignored until that scroll settles, so it never loops back.
// Drawings need no active page: every mounted page has its own ink layer.
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { useDocumentStore } from '@/stores';
import PageView from './PageView.vue';
import { usePinchZoom } from './usePinchZoom';
import { MAX_SCALE, MIN_SCALE } from '@/assets/utils/constans';

const docStore = useDocumentStore();

const scroller = ref<HTMLDivElement | null>(null);

// ---- layout ----------------------------------------------------------------
const PAD = 24; // space above the first and below the last page
const GAP = 16; // between pages

const sizes = reactive(new Map<number, { w: number; h: number }>());
const fallback = ref({ w: 612, h: 792 }); // US Letter until page 1 is known

const sizeOf = (page: number) => sizes.get(page) ?? fallback.value;

/** Top of each page's slot (index = page - 1) at `scale`, plus the total height. */
const layoutAt = (scale: number) => {
  const tops: number[] = [];
  let y = PAD;
  for (let page = 1; page <= docStore.totalPages; page++) {
    tops.push(y);
    y += sizeOf(page).h * scale + GAP;
  }
  return { tops, height: y - GAP + PAD };
};
const layout = computed(() => layoutAt(docStore.scale));

const slotStyle = (page: number) => {
  const { w, h } = sizeOf(page);
  return {
    width: `${Math.floor(w * docStore.scale)}px`,
    height: `${Math.floor(h * docStore.scale)}px`,
  };
};

// A page measured its real size. A change above the view would shift what
// the reader is looking at, so the scroll position absorbs it.
const onMeasured = (page: number, w: number, h: number) => {
  const known = sizes.get(page);
  if (known && Math.abs(known.w - w) < 0.5 && Math.abs(known.h - h) < 0.5) return;
  const el = scroller.value;
  const oldTop = layout.value.tops[page - 1];
  const oldH = sizeOf(page).h;
  sizes.set(page, { w, h });
  if (el && oldTop + oldH * docStore.scale <= el.scrollTop) {
    el.scrollTop += (h - oldH) * docStore.scale;
  }
};

// Page 1's size stands in for every page not measured yet (most books are
// uniform); asking each page for its size would fetch the whole file.
const measureFirstPage = async () => {
  const pdf = toRaw(docStore.pdf) as PDFDocumentProxy | null;
  if (!pdf) return;
  try {
    const page = await pdf.getPage(Math.min(docStore.activePage, pdf.numPages) || 1);
    const { width, height } = page.getViewport({ scale: 1 });
    fallback.value = { w: width, h: height };
  } catch {
    // keep the estimate
  }
};

// "Fit width": the page fills the view less its margins.
const SIDE = 48 + 16; // slot margins + scrollbar
let refitFrame = 0;
const updateFitWidth = () => {
  const el = scroller.value;
  if (!el || !fallback.value.w) return;
  docStore.fitWidthScale = Math.max(0.25, (el.clientWidth - SIDE) / fallback.value.w);
  // Still fitted: follow the new width (Navigator, chat, window), once per frame.
  if (docStore.fitToWidth && !refitFrame) {
    refitFrame = requestAnimationFrame(() => {
      refitFrame = 0;
      const target = Math.min(docStore.fitCap, Math.max(0.5, docStore.fitWidthScale));
      if (Math.abs(target - docStore.scale) > 0.01) docStore.fitWidth(docStore.fitCap);
    });
  }
};

// A document opens at the width of the view (a book is read, not inspected),
// but never blown up past 140 %.
const openAtFitWidth = () => {
  updateFitWidth();
  docStore.fitWidth(1.4);
};
let resizeObserver: ResizeObserver | null = null;

// ---- which pages are mounted ------------------------------------------------
const MAX_MOUNTED = 10;
const nearView = ref<Set<number>>(new Set());
let observer: IntersectionObserver | null = null;

const mounted = computed(() => {
  const pages = [...nearView.value];
  if (!pages.includes(docStore.activePage)) pages.push(docStore.activePage);
  if (pages.length <= MAX_MOUNTED) return new Set(pages);
  // Zoomed far out: keep the pages closest to the active one.
  pages.sort(
    (a, b) => Math.abs(a - docStore.activePage) - Math.abs(b - docStore.activePage)
  );
  return new Set(pages.slice(0, MAX_MOUNTED));
});

const observeSlots = () => {
  observer?.disconnect();
  const root = scroller.value;
  if (!root) return;
  observer = new IntersectionObserver(
    (entries) => {
      const next = new Set(nearView.value);
      for (const entry of entries) {
        const page = Number((entry.target as HTMLElement).dataset.slot);
        if (entry.isIntersecting) next.add(page);
        else next.delete(page);
      }
      nearView.value = next;
    },
    // One screen above and below stays mounted: no blank page while scrolling.
    { root, rootMargin: '100% 0px 100% 0px' }
  );
  root.querySelectorAll<HTMLElement>('[data-slot]').forEach((el) => observer!.observe(el));
};

// ---- scroll → active page ------------------------------------------------------
let jumping = false;
let settleTimer: ReturnType<typeof setTimeout> | null = null;
let frame = 0;

/** The page under a line a quarter down the view. */
const pageAtScroll = () => {
  const el = scroller.value;
  if (!el) return docStore.activePage;
  const probe = el.scrollTop + el.clientHeight * 0.25;
  const { tops } = layout.value;
  let lo = 0;
  let hi = tops.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (tops[mid] <= probe) lo = mid;
    else hi = mid - 1;
  }
  return lo + 1;
};

const onScroll = () => {
  // A jump's own scrolling must not report the pages it passes.
  if (jumping) {
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(endJump, 160);
    return;
  }
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    docStore.setActiveFromScroll(pageAtScroll());
  });
};

const endJump = () => {
  jumping = false;
  if (settleTimer) clearTimeout(settleTimer);
  settleTimer = null;
};

// ---- jumps → scroll ------------------------------------------------------------
const scrollToPage = async (page: number) => {
  await nextTick();
  const el = scroller.value;
  if (!el) return;
  const top = Math.max(0, layout.value.tops[page - 1] - 12);
  const distance = Math.abs(el.scrollTop - top);
  if (distance < 1) return;
  jumping = true;
  if (settleTimer) clearTimeout(settleTimer);
  settleTimer = setTimeout(endJump, 700); // in case no scroll event comes
  // Nearby: glide (the reader keeps their place); far: jump at once.
  el.scrollTo({ top, behavior: distance < el.clientHeight * 1.5 ? 'smooth' : 'auto' });
};

watch(
  () => docStore.scrollRequest?.seq,
  () => {
    const request = docStore.scrollRequest;
    if (request) scrollToPage(request.page);
  }
);

// ---- zoom keeps the reading position ----------------------------------------
// A pinch keeps the point under the fingers; buttons and keys keep the line
// at the top of the view and the horizontal centre.
let zoomFocus: { clientX: number; clientY: number } | null = null;

watch(
  () => docStore.scale,
  async (scale, oldScale) => {
    const el = scroller.value;
    if (!el || !oldScale) return;
    const rect = el.getBoundingClientRect();
    const focusY = zoomFocus ? zoomFocus.clientY - rect.top : 0;
    const focusX = zoomFocus ? zoomFocus.clientX - rect.left : el.clientWidth / 2;
    zoomFocus = null;

    // Which page, and where in it, sits under the focal line now.
    const before = layoutAt(oldScale);
    const y = el.scrollTop + focusY;
    let page = 1;
    for (let i = 0; i < before.tops.length; i++) if (before.tops[i] <= y) page = i + 1;
    const height = sizeOf(page).h * oldScale;
    const within = height ? (y - before.tops[page - 1]) / height : 0;
    // Horizontally: the fraction of the page's width under the focus (pages
    // are centred, so the scroll width alone says nothing while they fit).
    const slot = el.querySelector<HTMLElement>(`[data-slot="${page}"]`);
    const slotRect = slot?.getBoundingClientRect();
    const acrossX = slotRect?.width ? (rect.left + focusX - slotRect.left) / slotRect.width : 0.5;

    await nextTick();
    jumping = true;
    if (settleTimer) clearTimeout(settleTimer);
    settleTimer = setTimeout(endJump, 200);
    el.scrollTop = layout.value.tops[page - 1] + within * sizeOf(page).h * scale - focusY;
    if (slot) {
      const contentLeft = slot.getBoundingClientRect().left - rect.left + el.scrollLeft;
      el.scrollLeft = Math.max(0, contentLeft + acrossX * slot.offsetWidth - focusX);
    }
  },
  { flush: 'pre' }
);

const content = ref<HTMLDivElement | null>(null);
usePinchZoom(scroller, content, {
  scale: () => docStore.scale,
  min: MIN_SCALE,
  max: MAX_SCALE,
  enabled: () => docStore.isLoaded(),
  commit: ({ factor, clientX, clientY }) => {
    zoomFocus = { clientX, clientY };
    docStore.setScale(docStore.scale * factor);
  },
});

// ---- lifecycle -----------------------------------------------------------------
onMounted(async () => {
  await measureFirstPage();
  openAtFitWidth();
  await nextTick();
  observeSlots();
  if (scroller.value) {
    resizeObserver = new ResizeObserver(updateFitWidth);
    resizeObserver.observe(scroller.value);
  }
  if (docStore.scrollRequest) scrollToPage(docStore.scrollRequest.page);
  scroller.value?.addEventListener('scroll', onScroll, { passive: true });
  scroller.value?.addEventListener('scrollend', endJump);
});

// A new document: forget sizes, re-measure, re-observe.
watch(
  () => docStore.pdf,
  async () => {
    sizes.clear();
    nearView.value = new Set();
    await measureFirstPage();
    openAtFitWidth();
    await nextTick();
    observeSlots();
  }
);
watch(() => docStore.totalPages, () => nextTick(observeSlots));

onBeforeUnmount(() => {
  observer?.disconnect();
  resizeObserver?.disconnect();
  if (frame) cancelAnimationFrame(frame);
  if (settleTimer) clearTimeout(settleTimer);
  scroller.value?.removeEventListener('scroll', onScroll);
  scroller.value?.removeEventListener('scrollend', endJump);
});

const pages = computed(() => Array.from({ length: docStore.totalPages }, (_, i) => i + 1));
</script>

<template>
  <div
    ref="scroller"
    data-page-scroll
    class="w-full h-full overflow-auto overscroll-contain focus:outline-none touch-pan-x touch-pan-y"
    tabindex="0"
    :aria-label="$t('pdf-viewer')"
  >
    <div
      ref="content"
      class="w-max min-w-full flex flex-col items-center"
      :style="{ paddingTop: `${PAD}px`, paddingBottom: `${PAD}px`, rowGap: `${GAP}px` }"
    >
      <div
        v-for="page in pages"
        :key="page"
        :data-slot="page"
        class="relative shrink-0 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_8px_24px_rgba(0,0,0,0.10)] mx-6"
        :style="slotStyle(page)"
        :aria-label="$t('page-short', { page: docStore.pageLabel(page) ?? page })"
        role="group"
      >
        <PageView v-if="mounted.has(page)" :page="page" @measured="onMeasured" />
      </div>
    </div>
  </div>
</template>
