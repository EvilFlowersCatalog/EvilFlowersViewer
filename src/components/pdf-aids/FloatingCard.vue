<script setup lang="ts">
// One floating card for whatever a page item opens (figure, table, highlight).
// It lives in the viewer's float layer, so neither the page scroller nor the
// bottom bar clips it, and it stays inside the visible page area: its height is
// capped there, so the card scrolls inside instead of making the page scroll.
//
// Placement tries right, left, below and above the anchor and takes the spot
// that covers least of the anchor itself and of the other floating things
// ([data-efv-float]: the sidebar panel, explain, selection popups, other
// cards). It follows the anchor on scroll and zoom until the reader drags it by
// an element marked [data-drag-handle]; then it stays where it was dropped.
import { inject, onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue';
import { useDocumentStore } from '@/stores';

export type FloatRect = { left: number; top: number; right: number; bottom: number };

const props = withDefaults(
  defineProps<{
    /** Viewport rect of what the card describes; read live on every layout. */
    anchor: () => FloatRect | null;
    /** Viewport rect the card must stay inside. */
    bounds: () => FloatRect | null;
    gap?: number;
  }>(),
  { gap: 10 }
);

// Listeners like mouseenter go to the card itself, not the Teleport.
defineOptions({ inheritAttrs: false });

// Any press inside the card means the reader is using it: the owner pins it.
const emit = defineEmits<{ grab: [] }>();

const MARGIN = 8;

const layer = inject<Ref<HTMLElement | null>>('floatLayer', ref(null));
const docStore = useDocumentStore();
const root = ref<HTMLElement | null>(null);
const placed = ref(false);
const dragging = ref(false);
let detached = false;
let current = { x: 0, y: 0 };

const overlap = (a: FloatRect, b: FloatRect) =>
  Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
  Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

const obstacles = (): FloatRect[] => {
  const scope: ParentNode = layer.value?.closest('.efv-viewer') ?? document;
  return [...scope.querySelectorAll<HTMLElement>('[data-efv-float]')]
    .filter((el) => el !== root.value && !root.value?.contains(el))
    .map((el) => el.getBoundingClientRect())
    .filter((rect) => rect.width > 0 && rect.height > 0);
};

const layout = () => {
  const el = root.value;
  const outer = props.bounds();
  if (!el || !outer) return;
  const box = {
    left: outer.left + MARGIN,
    top: outer.top + MARGIN,
    right: outer.right - MARGIN,
    bottom: outer.bottom - MARGIN,
  };
  el.style.maxWidth = `${Math.max(160, box.right - box.left)}px`;
  el.style.maxHeight = `${Math.max(120, box.bottom - box.top)}px`;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const fitX = (x: number) => clamp(x, box.left, box.right - w);
  const fitY = (y: number) => clamp(y, box.top, box.bottom - h);

  const anchor = props.anchor();
  if (detached || !anchor) {
    current = detached || placed.value ? { x: fitX(current.x), y: fitY(current.y) } : { x: fitX(box.right - w), y: box.top };
  } else {
    const g = props.gap;
    // In order of preference; the index breaks ties.
    const candidates: [number, number][] = [
      [anchor.right + g, anchor.top],
      [anchor.left - g - w, anchor.top],
      [anchor.left, anchor.bottom + g],
      [anchor.right - w, anchor.bottom + g],
      [anchor.left, anchor.top - g - h],
      [anchor.right - w, anchor.top - g - h],
    ];
    const others = obstacles();
    let best = { x: 0, y: 0 };
    let bestScore = Infinity;
    candidates.forEach(([cx, cy], index) => {
      const x = fitX(cx);
      const y = fitY(cy);
      const rect = { left: x, top: y, right: x + w, bottom: y + h };
      const score =
        overlap(rect, anchor) * 4 +
        others.reduce((sum, other) => sum + overlap(rect, other) * 2, 0) +
        Math.abs(x - cx) +
        Math.abs(y - cy) +
        index;
      if (score < bestScore) {
        bestScore = score;
        best = { x, y };
      }
    });
    current = best;
  }
  el.style.left = `${current.x}px`;
  el.style.top = `${current.y}px`;
  placed.value = true;
};

let frame = 0;
const schedule = () => {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(layout);
};

// Scrolls anywhere (capture), except inside the card's own content.
const onScroll = (event: Event) => {
  if (root.value?.contains(event.target as Node)) return;
  schedule();
};

let observer: ResizeObserver | null = null;
onMounted(() => {
  layout();
  window.addEventListener('scroll', onScroll, true);
  window.addEventListener('resize', schedule);
  observer = new ResizeObserver(schedule);
  if (root.value) observer.observe(root.value);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  window.removeEventListener('scroll', onScroll, true);
  window.removeEventListener('resize', schedule);
  observer?.disconnect();
});
// Zoom and re-render move the anchor without scrolling anything.
watch(() => [docStore.scale, docStore.renderState, docStore.canvasWidth], schedule);

// Drag by the handle; buttons and fields inside it stay clickable.
let start: { pointerX: number; pointerY: number; x: number; y: number } | null = null;
const onPointerDown = (event: PointerEvent) => {
  emit('grab');
  const target = event.target as HTMLElement;
  if (event.button !== 0 || !target.closest('[data-drag-handle]') || target.closest('button, a, input, textarea, select'))
    return;
  start = { pointerX: event.clientX, pointerY: event.clientY, ...current };
  dragging.value = true;
  root.value?.setPointerCapture(event.pointerId);
  event.preventDefault();
};
const onPointerMove = (event: PointerEvent) => {
  if (!start) return;
  detached = true;
  current = { x: start.x + event.clientX - start.pointerX, y: start.y + event.clientY - start.pointerY };
  layout();
};
const onPointerUp = () => {
  start = null;
  dragging.value = false;
};

defineExpose({ relayout: schedule });
</script>

<template>
  <Teleport :to="layer" :disabled="!layer">
    <div
      v-bind="$attrs"
      ref="root"
      data-efv-float
      class="fixed z-40 flex flex-col"
      :class="[placed ? '' : 'invisible', dragging ? 'select-none [&_[data-drag-handle]]:cursor-grabbing' : '']"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <slot />
    </div>
  </Teleport>
</template>
