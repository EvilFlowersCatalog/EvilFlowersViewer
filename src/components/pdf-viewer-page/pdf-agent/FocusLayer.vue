<script setup lang="ts">
// A cited paragraph or figure (initialFocus, a chat citation): scrolled into
// view, its box outlined and its sentence flashed, then faded out. Transient:
// nothing here is stored or listed with the highlights.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useAssistantStore } from '@/stores';
import type { IPageBox } from '@/assets/utils/interfaces';
import { usePageContext } from '../usePageContext';
import { boxStyle, scrollPageToBox, unionBox } from '../usePageHover';

const props = defineProps<{ pageBodyRef: HTMLDivElement | null }>();

const assistantStore = useAssistantStore();
// This layer draws for its own page; every page in the stream has one.
const { page: pageNumber, rendered } = usePageContext();

const SHOWN_MS = 3500;
const FADE_MS = 800;

const focus = computed(() => assistantStore.focus);
const quadsPage = computed(() => focus.value?.quadsPage ?? focus.value?.page);

const bbox = computed(() =>
  rendered.value && focus.value?.bbox && pageNumber.value === focus.value.page ? focus.value.bbox : null
);
const quads = computed<IPageBox[]>(() =>
  rendered.value && focus.value?.quads?.length && pageNumber.value === quadsPage.value ? focus.value.quads : []
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

const scrollToBox = (box: IPageBox) => scrollPageToBox(props.pageBodyRef, box);

// Once this layer's page is rendered and holds part of the focus: scroll to
// its box, then fade it out. A sentence that runs onto the next page
// (`quadsPage`) is shown by that page's layer. The focus is dropped when its
// own show is over; scrolling past other pages never cancels it.
watch(
  () => [focus.value?.id, rendered.value] as const,
  async ([id]) => {
    const target = focus.value;
    const page = pageNumber.value;
    if (!target || id === undefined) return;
    if (page !== target.page && page !== quadsPage.value) return;
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
