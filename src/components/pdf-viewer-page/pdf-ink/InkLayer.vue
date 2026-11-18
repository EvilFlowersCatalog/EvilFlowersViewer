<script setup lang="ts">
// One page's drawings (#156): every object of the page, the stroke being
// drawn, the selection with its handles and the inspector beside it. Each
// mounted page has its own layer, so the reader draws on whichever page is
// under the pen; there is no "active page" for drawing.
import { computed, onMounted, ref, watch } from 'vue';
import DOMPurify from 'dompurify';
import { EDIT_TOOL } from '@/assets/utils/enums';
import { useDocumentStore, useInkStore } from '@/stores';
import { useInkInput } from '@/composables/useInkInput';
import { unionBounds, type InkBox, type InkSpace } from '@/core/annotations';
import { drawingOf } from './inkRender';
import InkInspector from './InkInspector.vue';
import InkNotes from './InkNotes.vue';

const props = defineProps<{
  page: number;
  /** The page at scale 1, in PDF points: the space of a layer drawn here first. */
  pageSize: InkSpace;
  pageBodyRef: HTMLElement | null;
}>();

const docStore = useDocumentStore();
const inkStore = useInkStore();
const svgRef = ref<SVGSVGElement | null>(null);

onMounted(() => void inkStore.ensurePage(props.page));
watch(() => props.page, (page) => void inkStore.ensurePage(page));

const space = computed<InkSpace>(() => inkStore.pageInk(props.page)?.space ?? props.pageSize);

// Text of the page under a box of this layer: what the mark is about.
const textUnder = (box: InkBox) => {
  const layer = props.pageBodyRef?.querySelector('.textLayer');
  const r = svgRef.value?.getBoundingClientRect();
  if (!layer || !r?.width) return '';
  const sx = r.width / space.value.w;
  const sy = r.height / space.value.h;
  const left = r.left + box.x * sx;
  const top = r.top + box.y * sy;
  const right = left + box.w * sx;
  const bottom = top + box.h * sy;
  const words: string[] = [];
  for (const span of layer.querySelectorAll<HTMLElement>('span')) {
    if (span.children.length || !span.textContent?.trim()) continue;
    const s = span.getBoundingClientRect();
    const overlapY = Math.min(bottom, s.bottom) - Math.max(top, s.top);
    if (s.right < left || s.left > right || overlapY < s.height * 0.4) continue;
    words.push(span.textContent);
  }
  return words.join(' ').replace(/\s+/g, ' ').trim().slice(0, 500);
};

const noteToOpen = ref<string | null>(null);
const input = useInkInput({
  page: () => props.page,
  svg: svgRef,
  space: () => space.value,
  textUnder,
  onNotePlaced: (id) => (noteToOpen.value = id),
});

const drawing = computed(() => docStore.drawMode && docStore.editTool !== EDIT_TOOL.MOUSE);

// Fingers: drawing takes the touch (one finger draws, two pinch); once a pen
// was seen, fingers scroll the page again.
const touchAction = computed(() => (!drawing.value ? 'auto' : inkStore.fingerDraws ? 'none' : 'pan-x pan-y'));

const cursor = computed(() => {
  switch (docStore.editTool) {
    case EDIT_TOOL.SELECT:
      return input.hoverId.value ? 'move' : 'default';
    case EDIT_TOOL.ERASER:
      return 'none';
    case EDIT_TOOL.NOTE:
      return 'copy';
    default:
      return 'crosshair';
  }
});

// ---- selection ------------------------------------------------------------------
const selectedHere = computed(() => (inkStore.selection?.page === props.page ? inkStore.selection.ids : []));
const selectionBox = computed<InkBox | null>(() => {
  if (!selectedHere.value.length) return null;
  const resized = input.resizing.value;
  if (resized) return resized;
  const ids = new Set(selectedHere.value);
  return unionBounds(input.shown.value.filter((o) => ids.has(o.id)));
});
const resizable = computed(
  () =>
    docStore.editTool === EDIT_TOOL.SELECT &&
    inkStore.selectedObjects.some((o) => o.kind !== 'note' && o.kind !== 'raw')
);

/** Lengths that stay the same on screen whatever the zoom, in layer units. */
const px = (n: number) => (n * space.value.w) / (props.pageSize.w * docStore.scale || 1);

const handles = computed(() => {
  const b = selectionBox.value;
  if (!b || !resizable.value) return [];
  const size = px(9);
  return (
    [
      ['nw', b.x, b.y],
      ['ne', b.x + b.w, b.y],
      ['sw', b.x, b.y + b.h],
      ['se', b.x + b.w, b.y + b.h],
    ] as const
  ).map(([corner, x, y]) => ({ corner, x: x - size / 2, y: y - size / 2, size }));
});

const hovered = computed(() =>
  input.hoverId.value && !selectedHere.value.includes(input.hoverId.value)
    ? input.shown.value.find((o) => o.id === input.hoverId.value) ?? null
    : null
);
const hoverBox = computed(() => (hovered.value ? unionBounds([hovered.value]) : null));

// A bare SVG fragment parses as unknown HTML and would be dropped: sanitise
// it inside an <svg>, then keep only the children.
const sanitize = (markup: string) =>
  DOMPurify.sanitize(`<svg xmlns="http://www.w3.org/2000/svg">${markup}</svg>`, {
    USE_PROFILES: { svg: true, svgFilters: true },
  }).replace(/^<svg[^>]*>|<\/svg>$/g, '');

// The inspector is shown once a gesture ends, never under a moving pen.
const showInspector = computed(
  () => !!selectionBox.value && docStore.drawMode && !input.busy.value && docStore.editTool !== EDIT_TOOL.ERASER
);
</script>

<template>
  <svg
    ref="svgRef"
    class="efv-ink absolute inset-0 w-full h-full z-[2] select-none"
    :class="drawing ? 'pointer-events-auto' : 'pointer-events-none'"
    :style="{ touchAction, cursor: drawing ? cursor : undefined }"
    :viewBox="`0 0 ${space.w} ${space.h}`"
    preserveAspectRatio="none"
    :data-ink-page="page"
    aria-hidden="true"
    @pointerdown="input.onPointerDown"
    @pointermove="input.onPointerMove"
    @pointerup="input.onPointerUp"
    @pointercancel="input.onPointerCancel"
    @pointerleave="input.onPointerLeave"
  >
    <template v-for="object in input.shown.value" :key="object.id">
      <template v-for="d in [drawingOf(object)]" :key="d.tag">
        <g v-if="d.tag === 'note'" class="efv-ink-note">
          <rect :x="d.x" :y="d.y" :width="d.size" :height="d.size" :rx="d.size * 0.22" :fill="d.color" stroke="rgba(0,0,0,0.25)" :stroke-width="px(1)" />
          <path
            :d="`M${d.x + d.size * 0.25},${d.y + d.size * 0.36} h${d.size * 0.5} M${d.x + d.size * 0.25},${d.y + d.size * 0.52} h${d.size * 0.5} M${d.x + d.size * 0.25},${d.y + d.size * 0.68} h${d.size * 0.3}`"
            stroke="rgba(0,0,0,0.55)"
            :stroke-width="d.size * 0.07"
            stroke-linecap="round"
          />
        </g>
        <g v-else-if="d.tag === 'raw'" v-html="sanitize(d.markup)" />
        <component :is="d.tag" v-else v-bind="d.attrs" />
      </template>
    </template>

    <!-- The stroke or shape being drawn -->
    <template v-if="input.live.value">
      <template v-for="d in [drawingOf(input.live.value, true)]" :key="d.tag">
        <component :is="d.tag" v-if="d.tag !== 'note' && d.tag !== 'raw'" v-bind="d.attrs" />
      </template>
    </template>

    <!-- Hover and selection -->
    <rect
      v-if="hoverBox"
      :x="hoverBox.x - px(3)"
      :y="hoverBox.y - px(3)"
      :width="hoverBox.w + px(6)"
      :height="hoverBox.h + px(6)"
      class="efv-ink-hover"
      vector-effect="non-scaling-stroke"
      :rx="px(3)"
    />
    <template v-if="selectionBox">
      <rect
        :x="selectionBox.x - px(4)"
        :y="selectionBox.y - px(4)"
        :width="selectionBox.w + px(8)"
        :height="selectionBox.h + px(8)"
        :rx="px(4)"
        class="efv-ink-selection"
        vector-effect="non-scaling-stroke"
      />
      <rect
        v-for="h in handles"
        :key="h.corner"
        :data-ink-handle="h.corner"
        :x="h.x"
        :y="h.y"
        :width="h.size"
        :height="h.size"
        :rx="h.size / 2"
        class="efv-ink-handle"
        :style="{ cursor: h.corner === 'nw' || h.corner === 'se' ? 'nwse-resize' : 'nesw-resize' }"
        vector-effect="non-scaling-stroke"
      />
    </template>

    <rect
      v-if="input.marquee.value"
      v-bind="{ x: input.marquee.value.x, y: input.marquee.value.y, width: input.marquee.value.w, height: input.marquee.value.h }"
      class="efv-ink-marquee"
      vector-effect="non-scaling-stroke"
    />
    <circle
      v-if="drawing && input.erasing.value && input.eraserAt.value"
      :cx="input.eraserAt.value[0]"
      :cy="input.eraserAt.value[1]"
      :r="px(8)"
      class="efv-ink-eraser"
      vector-effect="non-scaling-stroke"
    />
  </svg>

  <!-- Notes open from the page while reading -->
  <InkNotes :page="page" :space="space" @edit="noteToOpen = $event" />

  <InkInspector
    v-if="showInspector && selectionBox"
    :page="page"
    :space="space"
    :box="selectionBox"
    :open-note="noteToOpen !== null && selectedHere.includes(noteToOpen)"
    @note-closed="noteToOpen = null"
  />
</template>

<style>
.efv-ink-multiply {
  mix-blend-mode: multiply;
}
.efv-ink-selection {
  fill: none;
  stroke: var(--efv-primary);
  stroke-width: 1.5;
  stroke-dasharray: 4 3;
  pointer-events: none;
}
.efv-ink-hover {
  fill: none;
  stroke: var(--efv-primary);
  stroke-opacity: 0.45;
  stroke-width: 1;
  pointer-events: none;
}
.efv-ink-handle {
  fill: #fff;
  stroke: var(--efv-primary);
  stroke-width: 1.5;
}
.efv-ink-marquee {
  fill: rgba(0, 119, 204, 0.08);
  stroke: var(--efv-primary);
  stroke-width: 1;
  pointer-events: none;
}
.efv-ink-eraser {
  fill: rgba(255, 255, 255, 0.5);
  stroke: rgba(0, 0, 0, 0.45);
  stroke-width: 1;
  pointer-events: none;
}
</style>
