<script setup lang="ts">
// A cited paragraph or figure (initialFocus, a chat citation): scrolled into
// view, its box outlined and its sentence flashed, then faded out. Transient:
// nothing here is stored or listed with the highlights.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useAssistantStore, useDocumentStore } from '@/stores';
import { RENDER_STATE } from '@/assets/utils/enums';
import type { IPageBox } from '@/assets/utils/interfaces';
import { boxStyle, unionBox } from '../usePageHover';

const props = defineProps<{ pageBodyRef: HTMLDivElement | null }>();

const docStore = useDocumentStore();
const assistantStore = useAssistantStore();

const SHOWN_MS = 3500;
const FADE_MS = 800;

const focus = computed(() => assistantStore.focus);
const quadsPage = computed(() => focus.value?.quadsPage ?? focus.value?.page);
const rendered = computed(() => docStore.renderState === RENDER_STATE.RENDERED);

const bbox = computed(() =>
  rendered.value && focus.value?.bbox && docStore.activePage === focus.value.page ? focus.value.bbox : null
);
const quads = computed<IPageBox[]>(() =>
  rendered.value && focus.value?.quads?.length && docStore.activePage === quadsPage.value ? focus.value.quads : []
);

const fading = ref(false);
let fadeTimer: ReturnType<typeof setTimeout> | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;
let startedKey: string | null = null;

const stopTimers = () => {
  if (fadeTimer) clearTimeout(fadeTimer);
  if (clearTimer) clearTimeout(clearTimer);
  fadeTimer = clearTimer = null;
};

/** Scrolls the page scroller (never the host page) so `box` sits in the middle of it. */
const scrollToBox = (box: IPageBox) => {
  const body = props.pageBodyRef;
  const scroller = body?.closest<HTMLElement>('[data-page-scroll]');
  if (!body || !scroller) return;
  const page = body.getBoundingClientRect();
  const view = scroller.getBoundingClientRect();
  if (!page.width || !page.height) return;

  const margin = 24;
  const top = page.top - view.top + scroller.scrollTop + box.y0 * page.height;
  const height = (box.y1 - box.y0) * page.height;
  const left = page.left - view.left + scroller.scrollLeft + box.x0 * page.width;
  const width = (box.x1 - box.x0) * page.width;

  const center = (start: number, size: number, viewSize: number) =>
    size + 2 * margin > viewSize ? start - margin : start + size / 2 - viewSize / 2;

  scroller.scrollTo({
    top: Math.max(0, center(top, height, scroller.clientHeight)),
    left: Math.max(0, center(left, width, scroller.clientWidth)),
    behavior: 'smooth',
  });
};

// Once a page of the focus is on screen: scroll to its box, then fade it out.
// A sentence that runs onto the next page (`quadsPage`) gets its own show when
// the reader turns there; the focus is dropped once that is done too, or when
// the reader goes to an unrelated page.
watch(
  () => [focus.value?.id, rendered.value, docStore.activePage] as const,
  async ([id, , page]) => {
    const target = focus.value;
    if (!target || id === undefined) return;
    if (page !== target.page && page !== quadsPage.value) {
      stopTimers();
      assistantStore.clearFocus(id);
      return;
    }
    const key = `${id}:${page}`;
    if (!rendered.value || startedKey === key) return;

    startedKey = key;
    await nextTick();
    // Mounted before the first render started: the page body is not laid out
    // yet. The next RENDERED transition comes back here.
    if (!props.pageBodyRef?.getBoundingClientRect().width) {
      startedKey = null;
      return;
    }
    stopTimers();
    fading.value = false;
    const shown = bbox.value ?? (quads.value.length ? unionBox(quads.value) : null);
    if (shown) scrollToBox(shown);
    // The sentence's own page is still to come: fade here, keep the focus.
    const more = quadsPage.value !== target.page && page === target.page;
    fadeTimer = setTimeout(() => (fading.value = true), SHOWN_MS);
    if (!more) clearTimer = setTimeout(() => assistantStore.clearFocus(id), SHOWN_MS + FADE_MS);
  },
  { immediate: true }
);

onBeforeUnmount(stopTimers);
</script>

<template>
  <div
    v-if="bbox || quads.length"
    :key="focus?.id"
    class="absolute inset-0 z-[7] pointer-events-none transition-opacity"
    :class="fading ? 'opacity-0' : 'opacity-100'"
    :style="{ transitionDuration: `${FADE_MS}ms` }"
    aria-hidden="true"
  >
    <div v-if="bbox" class="absolute rounded-[3px] efv-focus-box" :style="boxStyle(bbox)" />
    <div
      v-for="(quad, index) in quads"
      :key="index"
      class="absolute rounded-[2px] mix-blend-multiply dark:mix-blend-normal efv-focus-quad"
      :style="boxStyle(quad)"
    />
  </div>
</template>
