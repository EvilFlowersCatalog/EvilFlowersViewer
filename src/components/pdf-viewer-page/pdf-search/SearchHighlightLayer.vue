<script setup lang="ts">
// Every hit of the search on this page, the selected one stronger and
// scrolled into view. Boxes are page fractions, so zoom, HiDPI and the worker
// renderer need nothing here, and selecting a hit never repaints the canvas.
// Pointer-transparent: the text layer underneath stays selectable.
import { computed, nextTick, watch } from 'vue';
import { useSearchStore } from '@/stores';
import { boxStyle, scrollPageToBox, unionBox } from '../usePageHover';
import { usePageContext } from '../usePageContext';

const props = defineProps<{ pageBodyRef: HTMLDivElement | null }>();

const search = useSearchStore();
const { page, rendered } = usePageContext();

const onPage = computed(() => (rendered.value ? search.hitsOnPage(page.value) : []));

// Scroll to the selected hit once its page is painted: after a selection, and
// after the page it lives on finished rendering.
watch(
  () => [search.selectSeq, rendered.value] as const,
  async () => {
    const hit = search.activeHit;
    if (!hit || !rendered.value || hit.page !== page.value || !hit.rects.length) return;
    await nextTick();
    scrollPageToBox(props.pageBodyRef, unionBox(hit.rects), { ifNeeded: true });
  },
  { immediate: true }
);
</script>

<template>
  <div
    v-if="onPage.length"
    class="absolute inset-0 z-[6] pointer-events-none"
    aria-hidden="true"
  >
    <template v-for="{ hit, active } in onPage" :key="hit.id">
      <div
        v-for="(rect, index) in hit.rects"
        :key="index"
        data-efv-mark
        class="absolute rounded-[2px] mix-blend-multiply"
        :class="
          hit.source !== 'text'
            ? 'efv-search-passage'
            : active
              ? 'efv-search-hit-active'
              : 'efv-search-hit'
        "
        :style="boxStyle(rect)"
      />
    </template>
  </div>
</template>

<style scoped>
.efv-search-hit {
  background: rgba(255, 214, 10, 0.42);
}
.efv-search-hit-active {
  background: rgba(255, 140, 0, 0.55);
  box-shadow: 0 0 0 2px rgba(230, 110, 0, 0.9);
}
/* A related or host passage: a calm blue wash, distinct from word matches. */
.efv-search-passage {
  background: rgba(0, 119, 204, 0.16);
  box-shadow: inset 3px 0 0 rgba(0, 119, 204, 0.85);
}
</style>
