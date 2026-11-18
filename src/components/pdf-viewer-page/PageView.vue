<script setup lang="ts">
// One page of the continuous view: its bitmap, text layer, links and every
// per-page layer (drawings, search hits, highlights, regions, focus,
// selection). Mounted only while the page is in the stream's window around
// the view; leaving it releases the bitmap.
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import { useAssistantStore, useDocumentStore, useInkStore, useViewerStore } from '@/stores';
import { TextLayer } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PageViewport } from 'pdfjs-dist/types/src/display/page_viewport';
import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { EDIT_TOOL, RENDER_STATE } from '@/assets/utils/enums';
// Drawings load after the page paints: the layer, its input and perfect-freehand are one lazy chunk.
const InkLayer = defineAsyncComponent(() => import('./pdf-ink/InkLayer.vue'));
import { BookmarkIcon } from '../pdf-aids';
import { SelectionLayer } from './pdf-selection';
import RegionLayer from './pdf-regions/RegionLayer.vue';
import AgentHighlightLayer from './pdf-agent/AgentHighlightLayer.vue';
import FocusLayer from './pdf-agent/FocusLayer.vue';
import SearchHighlightLayer from './pdf-search/SearchHighlightLayer.vue';
import { boxStyle } from './usePageHover';
import { providePageContext } from './usePageContext';
import type { IPageBox, ISelectionInfo } from '@/assets/utils/interfaces';
import { useTextSelection } from '@/composables/useTextSelection';
import { isPageFetchFailure } from '@/core/document/loadErrors';

const props = defineProps<{
  page: number;
}>();
const emit = defineEmits<{
  /** Page size at scale 1, once known (the stream lays pages out with it). */
  measured: [page: number, width: number, height: number];
}>();

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();
const inkStore = useInkStore();
/** The page at scale 1, in PDF points (the drawing layer's space). */
const baseSize = ref<{ w: number; h: number } | null>(null);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const textLayerRef = ref<HTMLDivElement | null>(null);
const pageBodyRef = ref<HTMLDivElement | null>(null);

const rendered = ref(false);
const isActive = computed(() => docStore.activePage === props.page);
providePageContext({
  page: computed(() => props.page),
  rendered: computed(() => rendered.value),
});

// The active page speaks for the whole view: zoom waits for it, the drawing
// canvas sizes itself to it.
const publishState = (state: RENDER_STATE) => {
  if (isActive.value) docStore.renderState = state;
};

// ---- links ----------------------------------------------------------------
type PageLink = { box: IPageBox; href?: string; page?: number };
const links = ref<PageLink[]>([]);
const URL_IN_TEXT = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+[^\s<>"'`.,;:!?)\]}]/gi;

const doc = () => toRaw(docStore.pdf) as PDFDocumentProxy | null;

const resolveDestPage = async (dest: unknown): Promise<number | undefined> => {
  const pdf = doc();
  if (!pdf || !dest) return undefined;
  try {
    const explicit = typeof dest === 'string' ? await pdf.getDestination(dest) : (dest as any[]);
    const target = explicit?.[0];
    if (target == null) return undefined;
    return (typeof target === 'number' ? target : await pdf.getPageIndex(target)) + 1;
  } catch {
    return undefined;
  }
};

const annotationLinks = async (page: PDFPageProxy): Promise<PageLink[]> => {
  const viewport = page.getViewport({ scale: 1 });
  const found: PageLink[] = [];
  for (const annotation of await page.getAnnotations({ intent: 'display' })) {
    if (annotation.subtype !== 'Link' || !annotation.rect) continue;
    // pdf.js 6.5 dropped convertToViewportRectangle: map both corners.
    const [x1, y1, x2, y2] = annotation.rect as number[];
    const [ax, ay] = viewport.convertToViewportPoint(x1, y1);
    const [bx, by] = viewport.convertToViewportPoint(x2, y2);
    const box = {
      x0: Math.min(ax, bx) / viewport.width,
      y0: Math.min(ay, by) / viewport.height,
      x1: Math.max(ax, bx) / viewport.width,
      y1: Math.max(ay, by) / viewport.height,
    };
    const href = annotation.url || annotation.unsafeUrl;
    if (href && /^(https?:|mailto:)/i.test(href)) found.push({ box, href });
    else {
      const target = await resolveDestPage(annotation.dest);
      if (target) found.push({ box, page: target });
    }
  }
  return found;
};

// Addresses that are only printed as text, one box per line they occupy.
const textLinks = (known: PageLink[]): PageLink[] => {
  const layer = textLayerRef.value;
  const body = pageBodyRef.value?.getBoundingClientRect();
  if (!layer || !body?.width || !body.height) return [];
  const found: PageLink[] = [];
  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.textContent ?? '';
    for (const match of text.matchAll(URL_IN_TEXT)) {
      const href = /^https?:/i.test(match[0]) ? match[0] : `https://${match[0]}`;
      if (known.some((link) => link.href === href)) continue;
      const range = document.createRange();
      range.setStart(node, match.index!);
      range.setEnd(node, match.index! + match[0].length);
      for (const rect of range.getClientRects()) {
        if (!rect.width || !rect.height) continue;
        found.push({
          href,
          box: {
            x0: (rect.left - body.left) / body.width,
            y0: (rect.top - body.top) / body.height,
            x1: (rect.right - body.left) / body.width,
            y1: (rect.bottom - body.top) / body.height,
          },
        });
      }
    }
  }
  return found;
};

const collectLinks = async (page: PDFPageProxy) => {
  let fromAnnotations: PageLink[] = [];
  try {
    fromAnnotations = await annotationLinks(page);
  } catch {
    // a broken annotation dictionary only costs the links
  }
  await nextTick();
  links.value = [...fromAnnotations, ...textLinks(fromAnnotations)];
};

const followLink = (event: MouseEvent, link: PageLink) => {
  if (link.href) return; // the anchor opens it in a new tab
  event.preventDefault();
  if (link.page) docStore.goTo(link.page, 'link');
};

// ---- rendering ------------------------------------------------------------
let renderTask: ReturnType<PDFPageProxy['render']> | null = null;
let textLayer: TextLayer | null = null;
let disposed = false;

const MAX_CANVAS_PIXELS = 16_777_216;
const pixelRatio = (width: number, height: number) => {
  const dpr = window.devicePixelRatio || 1;
  return Math.max(1, Math.min(dpr, Math.sqrt(MAX_CANVAS_PIXELS / (width * height))));
};

// Rasterise at device pixels, not CSS pixels: on a HiDPI screen a CSS-sized
// bitmap is upscaled by the browser and the page looks blurry. Capped under
// Safari's 16.7 MP canvas limit at high zoom.
// Double-buffered: the new bitmap is drawn off screen and copied in at once,
// so after a zoom the old one (stretched by CSS) stays visible meanwhile
// instead of the page flashing blank.
const paintCanvas = async (page: PDFPageProxy, viewport: PageViewport) => {
  const canvas = canvasRef.value;
  if (!canvas) return false;
  const outputScale = pixelRatio(viewport.width, viewport.height);
  renderTask?.cancel();
  const buffer = document.createElement('canvas');
  buffer.width = Math.floor(viewport.width * outputScale);
  buffer.height = Math.floor(viewport.height * outputScale);
  renderTask = page.render({
    canvas: buffer,
    viewport,
    transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
  });
  try {
    await renderTask.promise;
  } catch (error: any) {
    buffer.width = buffer.height = 0;
    if (error?.name === 'RenderingCancelledException') return false;
    throw error;
  }
  renderTask = null;
  if (disposed) {
    buffer.width = buffer.height = 0;
    return false;
  }
  canvas.width = buffer.width;
  canvas.height = buffer.height;
  canvas.getContext('2d')?.drawImage(buffer, 0, 0);
  buffer.width = buffer.height = 0; // free the buffer's pixels now
  return true;
};

// The viewer-wide selection engine adopts this page's text layer (selection
// guard, clean copy, the menu's model).
const textSelection = useTextSelection();
let releaseTextLayer: (() => void) | null = null;

const buildTextLayer = async (page: PDFPageProxy, viewport: PageViewport) => {
  const container = textLayerRef.value;
  if (!container) return;
  textLayer?.cancel();
  container.replaceChildren();
  const textContentSource = await page.getTextContent();
  if (disposed) return;
  textLayer = new TextLayer({ textContentSource, container, viewport });
  await textLayer.render();
  if (disposed) return;
  releaseTextLayer?.();
  releaseTextLayer = textSelection?.register(container) ?? null;
};

// A page whose bytes could not be fetched after the document opened (a Range
// request failed: network drop, expired signed URL) is a stream error with a
// Reconnect, not a broken viewer. Anything else goes to the error boundary.
const settleOnError = (error: unknown) => {
  rendered.value = true;
  publishState(RENDER_STATE.RENDERED);
  const fetchFailed = isPageFetchFailure(error);
  if (fetchFailed && docStore.openStatus === 'ready') {
    docStore.reportStreamError(fetchFailed.status);
    return;
  }
  if (isActive.value) docStore.reportDocumentError('render'); // no-op after the first paint
  throw error;
};

const viewportSize = ref<{ width: number; height: number } | null>(null);
let builtTextLayer = false;

// Full render, or a re-raster after zoom / pixel-ratio change (the text
// layer is then only reflowed, pdf.js 6 TextLayer.update).
const render = async () => {
  const pdf = doc();
  if (!pdf || disposed) return;
  // Re-renders (zoom, pixel ratio) keep the previous bitmap and the layers
  // visible; only the very first render starts from a blank page.
  publishState(RENDER_STATE.RENDERING);
  const kind = rendered.value ? 'rerender' : 'initial';
  const startedAt = performance.now();
  try {
    const page = await pdf.getPage(props.page);
    if (disposed) return;
    const base = page.getViewport({ scale: 1 });
    emit('measured', props.page, base.width, base.height);
    baseSize.value = { w: base.width, h: base.height };
    const viewport = page.getViewport({ scale: docStore.scale });
    viewportSize.value = { width: viewport.width, height: viewport.height };
    if (isActive.value) {
      docStore.canvasWidth = viewport.width;
      docStore.canvasHeight = viewport.height;
    }
    if (!(await paintCanvas(page, viewport))) return; // superseded
    if (disposed) return;
    const paintedAt = performance.now();
    rendered.value = true;
    // The opening page's paint is the host's "first page" moment.
    if (isActive.value) docStore.reportFirstPaint(props.page);
    if (textLayer && builtTextLayer) textLayer.update({ viewport });
    else {
      await buildTextLayer(page, viewport);
      builtTextLayer = true;
      collectLinks(page);
    }
    publishState(RENDER_STATE.RENDERED);
    viewerStore.telemetry.record(
      'page.render',
      {
        page: props.page,
        kind,
        scale: Math.round(docStore.scale * 100) / 100,
        pixelRatio: Math.round(pixelRatio(viewport.width, viewport.height) * 100) / 100,
        textLayerMs: Math.round(performance.now() - paintedAt),
      },
      { durationMs: paintedAt - startedAt }
    );
  } catch (error) {
    if (!disposed) settleOnError(error);
  }
};

onMounted(render);
watch(() => docStore.scale, render);
// A new document remounts the whole page stream (PDFViewer keys it by
// document), so a page never shows the previous document's bitmap.

// Becoming the active page: report this page's state and size to the view.
watch(isActive, (active) => {
  if (!active) return;
  docStore.renderState = rendered.value ? RENDER_STATE.RENDERED : RENDER_STATE.RENDERING;
  if (viewportSize.value) {
    docStore.canvasWidth = viewportSize.value.width;
    docStore.canvasHeight = viewportSize.value.height;
  }
});

// Browser zoom or another screen changes devicePixelRatio: repaint sharp.
let dprQuery: MediaQueryList | null = null;
const watchPixelRatio = () => {
  dprQuery?.removeEventListener('change', onPixelRatioChange);
  dprQuery = window.matchMedia?.(`(resolution: ${window.devicePixelRatio || 1}dppx)`) ?? null;
  dprQuery?.addEventListener('change', onPixelRatioChange);
};
function onPixelRatioChange() {
  watchPixelRatio();
  if (rendered.value) render();
}
onMounted(watchPixelRatio);

onBeforeUnmount(() => {
  disposed = true;
  dprQuery?.removeEventListener('change', onPixelRatioChange);
  renderTask?.cancel();
  textLayer?.cancel();
  releaseTextLayer?.();
  // Free the bitmap now rather than whenever the element is collected:
  // at DPR 2–3 a page is tens of megabytes.
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
  }
});

// ---- bookmark, selection ----------------------------------------------------
const isBookmarked = computed(() => docStore.isBookmarked(props.page));
const toggleBookmark = () => docStore.toggleBookmark(props.page);

// "Highlight" on a selection: the host stores it (one highlight per page the
// selection covers), or it becomes marks on the drawing layer of each page.
const handleHighlight = (selection: ISelectionInfo) => {
  if (viewerStore.readerHighlightPackage) {
    for (const segment of selection.segments)
      assistantStore.addReaderHighlight({ page: segment.page, text: selection.text, quads: segment.boxes });
    return;
  }
  // Pages of a uniform book share this page's size; a page drawn on
  // before keeps its own layer space.
  const space = baseSize.value ?? { w: 612, h: 792 };
  for (const segment of selection.segments)
    inkStore.addMarks(segment.page, segment.boxes, space, selection.text);
};

// The passage the open Explain card is about, on this page.
const explainBoxes = computed<IPageBox[]>(
  () => assistantStore.explainRequest?.segments?.find((s) => s.page === props.page)?.boxes ?? []
);

const pointerTool = computed(() => docStore.editTool === EDIT_TOOL.MOUSE);
</script>

<template>
  <div
    ref="pageBodyRef"
    data-page-body
    :data-page="page"
    class="group relative w-full h-full bg-white"
    :style="{ '--scale-factor': docStore.scale }"
  >
    <!-- Bitmap: decorative; the text layer carries the readable content -->
    <canvas
      ref="canvasRef"
      class="block w-full h-full transition-opacity duration-200"
      :class="rendered ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
    />

    <!-- The reader's drawings: objects, pen and touch input -->
    <InkLayer v-if="docStore.edit && baseSize" :page="page" :page-size="baseSize" :page-body-ref="pageBodyRef" />

    <div
      ref="textLayerRef"
      class="textLayer"
      :class="pointerTool ? 'pointer-events-auto select-auto' : 'pointer-events-none select-none'"
    />

    <template v-if="pointerTool">
      <a
        v-for="(link, index) in links"
        :key="index"
        class="absolute z-[4] rounded-[2px] cursor-pointer hover:bg-secondary/15 hover:shadow-[inset_0_-1px_0_var(--efv-primary)]"
        :style="boxStyle(link.box)"
        :href="link.href ?? '#'"
        :target="link.href ? '_blank' : undefined"
        :rel="link.href ? 'noopener noreferrer' : undefined"
        :title="link.href ?? $t('page-short', { page: link.page })"
        :aria-label="link.href ?? $t('page-short', { page: link.page })"
        @click="followLink($event, link)"
      />
      <AgentHighlightLayer :page-body-ref="pageBodyRef" />
      <RegionLayer :page-body-ref="pageBodyRef" :canvas-ref="canvasRef" />
    </template>

    <SearchHighlightLayer :page-body-ref="pageBodyRef" />
    <FocusLayer :page-body-ref="pageBodyRef" />

    <!-- What the open Explain card is about -->
    <div
      v-for="(box, index) in explainBoxes"
      :key="`explain-${index}`"
      class="efv-explain-source absolute z-[3] pointer-events-none"
      :style="boxStyle(box)"
      aria-hidden="true"
    />

    <!-- Bookmark: the page's own corner, shown on hover, pinned once set -->
    <button
      v-if="pointerTool"
      type="button"
      class="absolute top-0 right-0 z-10 w-7 h-7 flex items-center justify-center rounded-[6px] transition-opacity duration-150 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      :class="[
        isBookmarked ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        docStore.bookmarkPending.has(page) ? 'cursor-wait' : 'cursor-pointer',
      ]"
      :aria-pressed="isBookmarked"
      :aria-label="$t(isBookmarked ? 'remove-page-bookmark' : 'add-page-bookmark')"
      :title="$t(isBookmarked ? 'remove-page-bookmark' : 'add-page-bookmark')"
      @click="toggleBookmark"
    >
      <BookmarkIcon :filled="isBookmarked" :width="13" :height="17" />
    </button>

    <SelectionLayer v-if="pointerTool" :page-body-ref="pageBodyRef" @highlight="handleHighlight" />
  </div>
</template>
