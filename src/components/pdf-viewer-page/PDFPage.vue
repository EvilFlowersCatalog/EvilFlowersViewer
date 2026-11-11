<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import { useAssistantStore, useDocumentStore, useViewerStore } from '@/stores';
import { TextLayer } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PageViewport } from 'pdfjs-dist/types/src/display/page_viewport';
import type { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { EDIT_TOOL, RENDER_STATE } from '@/assets/utils/enums';
import { BookmarkIcon, Loader } from '../pdf-aids';
import { EditCanvas } from './pdf-edit';
import { SelectionLayer } from './pdf-selection';
import RegionLayer from './pdf-regions/RegionLayer.vue';
import AgentHighlightLayer from './pdf-agent/AgentHighlightLayer.vue';
import { boxStyle } from './usePageHover';
import type { IPageBox } from '@/assets/utils/interfaces';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();
let pdf = toRaw(docStore.pdf);

// Template refs replace the former global getElementById('pdf-page-canvas' /
// 'textLayer') lookups so several viewers can live on one page.
const canvasRef = ref<HTMLCanvasElement | null>(null);
const textLayerRef = ref<HTMLDivElement | null>(null);
const pageBodyRef = ref<HTMLDivElement | null>(null);
const editCanvasRef = ref<InstanceType<typeof EditCanvas> | null>(null);

// SelectionLayer's "Zvýrazniť". With a host that stores the reader's highlights
// it becomes a listed text highlight (page fractions, one box per line);
// otherwise it is painted onto the drawing overlay as before.
const handleHighlight = (rects: DOMRect[], text: string) => {
  const body = pageBodyRef.value;
  if (!viewerStore.readerHighlightPackage || !body) {
    editCanvasRef.value?.addHighlight(rects);
    return;
  }
  const bounds = body.getBoundingClientRect();
  assistantStore.addReaderHighlight({
    page: docStore.activePage,
    text: text.replace(/\s+/g, ' ').trim(),
    quads: lineBoxes(rects).map((rect) => ({
      x0: clamp((rect.left - bounds.left) / bounds.width),
      y0: clamp((rect.top - bounds.top) / bounds.height),
      x1: clamp((rect.right - bounds.left) / bounds.width),
      y1: clamp((rect.bottom - bounds.top) / bounds.height),
    })),
  });
};

const clamp = (value: number) => Math.min(1, Math.max(0, Number(value.toFixed(5))));

/** One box per text line: the selection's client rects come one per text span. */
const lineBoxes = (rects: DOMRect[]) => {
  const lines: { left: number; top: number; right: number; bottom: number }[] = [];
  for (const rect of [...rects].sort((a, b) => a.top - b.top || a.left - b.left)) {
    const line = lines.find((l) => Math.abs(l.top - rect.top) < rect.height / 2);
    if (line) {
      line.left = Math.min(line.left, rect.left);
      line.right = Math.max(line.right, rect.right);
      line.top = Math.min(line.top, rect.top);
      line.bottom = Math.max(line.bottom, rect.bottom);
    } else {
      lines.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
    }
  }
  return lines;
};

// Clickable links over the page: the PDF's own link annotations (web links open
// in a new tab, internal ones jump to their page) plus web addresses that are
// only printed as text. Boxes are page fractions, so zoom needs no recompute.
type PageLink = { box: IPageBox; href?: string; page?: number };
const links = ref<PageLink[]>([]);
const URL_IN_TEXT = /\b(?:https?:\/\/|www\.)[^\s<>"'`]+[^\s<>"'`.,;:!?)\]}]/gi;

const resolveDestPage = async (dest: unknown): Promise<number | undefined> => {
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
    const [ax, ay, bx, by] = viewport.convertToViewportRectangle(annotation.rect);
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

// Addresses in the rendered text layer, one box per line they occupy.
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
  const pageNumber = docStore.activePage;
  let fromAnnotations: PageLink[] = [];
  try {
    fromAnnotations = await annotationLinks(page);
  } catch {
    // a broken annotation dictionary only costs the links
  }
  await nextTick(); // the page body is hidden until the render state flips
  if (pageNumber !== docStore.activePage) return;
  links.value = [...fromAnnotations, ...textLinks(fromAnnotations)];
};

const followLink = (event: MouseEvent, link: PageLink) => {
  if (link.href) return; // the anchor opens it in a new tab
  event.preventDefault();
  if (link.page) docStore.activePage = link.page;
};

// A single reused render task + TextLayer instance. Keeping the TextLayer lets
// us reflow it on zoom via pdf.js 6's update() instead of rebuilding it.
let renderTask: ReturnType<PDFPageProxy['render']> | null = null;
let textLayer: TextLayer | null = null;
let textLayerPage = 0; // page number the current TextLayer was built for

// Bookmark for the page currently on screen. The button sits in the page's
// own corner, so it always refers to docStore.activePage.
const isBookmarked = computed(() => docStore.isBookmarked(docStore.activePage));

const toggleBookmark = () => docStore.toggleBookmark(docStore.activePage);

const paintCanvas = async (page: PDFPageProxy, viewport: PageViewport) => {
  const canvas = canvasRef.value;
  if (!canvas) return false;

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  // Cancel an in-flight render before starting a new one.
  renderTask?.cancel();

  // pdf.js v6 takes the canvas element directly and manages its 2D context.
  renderTask = page.render({ canvas, viewport });
  try {
    await renderTask.promise;
  } catch (error: any) {
    if (error?.name === 'RenderingCancelledException') return false;
    throw error;
  }
  renderTask = null;
  return true;
};

// Paint the active search hit onto the freshly rendered canvas. Coordinates are
// unscaled (PDF user space, y-up) and scaled here to the current zoom, so the
// highlight lands correctly at any scale and after any re-render.
const drawHighlight = (viewport: PageViewport) => {
  const hl = docStore.searchHighlight;
  const canvas = canvasRef.value;
  if (!hl || !canvas || hl.page !== docStore.activePage || !hl.transform) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const s = viewport.scale;
  const x = hl.transform[4] * s;
  const y = canvas.height - hl.transform[5] * s - hl.height * s;

  ctx.save();
  ctx.fillStyle = 'orange';
  ctx.globalAlpha = 0.5;
  ctx.fillRect(x, y, hl.width * s, hl.height * s);
  ctx.restore();
};

// Transforms of the text items behind the current text layer, in the order
// pdf.js created its spans (textLayer.textDivs), so a search hit can be mapped
// to its span.
let textItemTransforms: number[][] = [];

const buildTextLayer = async (page: PDFPageProxy, viewport: PageViewport) => {
  const container = textLayerRef.value;
  if (!container) return;

  textLayer?.cancel();
  container.replaceChildren();

  const textContentSource = await page.getTextContent();
  // TextLayer makes one span per item that has `str`, and skips the rest.
  textItemTransforms = textContentSource.items
    .filter((item) => 'str' in item)
    .map((item) => (item as { transform: number[] }).transform);
  textLayer = new TextLayer({ textContentSource, container, viewport });
  await textLayer.render();
  textLayerPage = docStore.activePage;
};

const sameTransform = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);

// The canvas is aria-hidden, so the painted highlight alone is invisible to
// screen readers. Mark the matching text-layer span as the current match too.
const markSearchHit = () => {
  const container = textLayerRef.value;
  if (!container) return;

  container.querySelectorAll('[data-search-hit]').forEach((el) => {
    el.removeAttribute('data-search-hit');
    el.removeAttribute('role');
    el.removeAttribute('aria-current');
    el.removeAttribute('aria-roledescription');
  });

  const hl = docStore.searchHighlight;
  if (!hl?.transform || !textLayer || hl.page !== textLayerPage) return;

  const index = textItemTransforms.findIndex((tr) =>
    sameTransform(tr, hl.transform)
  );
  const span = index >= 0 ? textLayer.textDivs[index] : undefined;
  if (!span) return;

  span.setAttribute('data-search-hit', '');
  span.setAttribute('role', 'mark');
  span.setAttribute('aria-current', 'true');
  span.setAttribute('aria-roledescription', t('search-hit'));
};

// A failed render must not leave the page loader spinning forever. The error
// still propagates to the viewer's error boundary, which shows a notice.
const settleOnError = (error: unknown) => {
  docStore.renderState = RENDER_STATE.RENDERED;
  throw error;
};

// Full render: new page (or first paint). Rasterises the canvas and (re)builds
// the text layer from scratch.
const renderPage = async () => {
  if (!pdf) return;
  docStore.renderState = RENDER_STATE.RENDERING;

  try {
    links.value = [];
    const page = await pdf.getPage(docStore.activePage);
    const viewport = page.getViewport({ scale: docStore.scale });
    docStore.canvasWidth = viewport.width;
    docStore.canvasHeight = viewport.height;

    if (!(await paintCanvas(page, viewport))) return; // superseded
    await buildTextLayer(page, viewport);
    drawHighlight(viewport);
    markSearchHit();

    docStore.renderState = RENDER_STATE.RENDERED;
    collectLinks(page);
  } catch (error) {
    settleOnError(error);
  }
};

// Zoom: re-rasterise the canvas for crispness, but only reflow the existing
// text layer (pdf.js 6 TextLayer.update) rather than re-fetching text content.
const rescale = async () => {
  if (!pdf) return;
  docStore.renderState = RENDER_STATE.RENDERING;

  try {
    const page = await pdf.getPage(docStore.activePage);
    const viewport = page.getViewport({ scale: docStore.scale });
    docStore.canvasWidth = viewport.width;
    docStore.canvasHeight = viewport.height;

    if (!(await paintCanvas(page, viewport))) return;

    if (textLayer && textLayerPage === docStore.activePage) {
      textLayer.update({ viewport });
    } else {
      await buildTextLayer(page, viewport);
    }
    drawHighlight(viewport);
    markSearchHit();

    docStore.renderState = RENDER_STATE.RENDERED;
  } catch (error) {
    settleOnError(error);
  }
};

// Cheap repaint used when only the search highlight changes on the current
// page: re-rasterise (clears the previous highlight) and draw, no text work and
// no loader flash.
const repaint = async () => {
  if (!pdf) return;
  const page = await pdf.getPage(docStore.activePage);
  const viewport = page.getViewport({ scale: docStore.scale });
  if (await paintCanvas(page, viewport)) drawHighlight(viewport);
  markSearchHit();
};

onMounted(renderPage);

onBeforeUnmount(() => {
  renderTask?.cancel();
  textLayer?.cancel();
});

// Order matters: this watch is registered before the highlight watch so that on
// page navigation renderState is already RENDERING when the highlight watch
// runs, letting it skip (renderPage will draw the highlight itself).
watch(
  () => docStore.activePage,
  () => renderPage()
);

watch(
  () => docStore.pdf,
  () => {
    pdf = toRaw(docStore.pdf);
    renderPage();
  }
);

watch(
  () => docStore.scale,
  () => rescale()
);

// Same-page highlight change (set or cleared) → repaint only. Different-page
// changes are handled by the activePage watch, which redraws the highlight
// after rendering; skipping while a render is in flight avoids a double paint.
watch(
  () => docStore.searchHighlight,
  (hl) => {
    if (docStore.renderState !== RENDER_STATE.RENDERED) return;
    if (!hl || hl.page === docStore.activePage) repaint();
  }
);
</script>

<template>
  <div
    data-page-scroll
    class="flex w-full h-full p-5 overflow-auto"
  >
    <!-- Loader -->
    <Loader
      v-if="docStore.renderState === RENDER_STATE.RENDERING"
      :size="70"
      color="#4a9cff"
    />

    <!-- Content -->
    <div
      ref="pageBodyRef"
      data-page-body
      :class="
        docStore.renderState === RENDER_STATE.RENDERING
          ? 'hidden'
          : 'group relative m-auto'
      "
      :style="{ '--scale-factor': docStore.scale }"
    >
      <!-- Canvas for editing -->
      <EditCanvas
        v-if="docStore.edit"
        ref="editCanvasRef"
        :class="
          EDIT_TOOL.MOUSE === docStore.editTool
            ? 'pointer-events-none'
            : 'pointer-events-auto cursor-crosshair'
        "
      />

      <!-- Canvas — decorative raster; the text layer below carries the
           selectable, screen-reader-readable content. -->
      <canvas
        ref="canvasRef"
        class="shadow-[0_0_20px_5px_rgba(0,0,0,0.2)]"
        aria-hidden="true"
      ></canvas>

      <!-- Text layer -->
      <div
        ref="textLayerRef"
        class="textLayer"
        :class="
          EDIT_TOOL.MOUSE === docStore.editTool
            ? 'pointer-events-auto select-auto'
            : 'pointer-events-none select-none'
        "
      ></div>

      <!-- Links (web: new tab; internal: jump to the page) -->
      <template v-if="EDIT_TOOL.MOUSE === docStore.editTool">
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
      </template>

      <!-- IP-018 layers: agent highlights and extracted regions. Both hit-test
           the pointer position, so the text layer underneath stays selectable. -->
      <template v-if="EDIT_TOOL.MOUSE === docStore.editTool">
        <AgentHighlightLayer :page-body-ref="pageBodyRef" />
        <RegionLayer :page-body-ref="pageBodyRef" :canvas-ref="canvasRef" />
      </template>

      <!-- Bookmark toggle — top-right corner of the page itself. Revealed on
           hover (or keyboard focus), and pinned visible once the page is
           bookmarked so the state is never hidden. Hidden while a drawing tool
           is picked so it can't swallow strokes started in that corner (same
           rule SelectionLayer follows). -->
      <button
        v-if="EDIT_TOOL.MOUSE === docStore.editTool"
        type="button"
        class="absolute top-0 right-0 z-10 w-7 h-7 flex items-center justify-center rounded-[6px] transition-opacity duration-150 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        :class="[
          isBookmarked
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100',
          docStore.bookmarkPending.has(docStore.activePage)
            ? 'cursor-wait'
            : 'cursor-pointer',
        ]"
        :aria-pressed="isBookmarked"
        :aria-label="$t(isBookmarked ? 'remove-page-bookmark' : 'add-page-bookmark')"
        :title="$t(isBookmarked ? 'remove-page-bookmark' : 'add-page-bookmark')"
        @click="toggleBookmark"
      >
        <BookmarkIcon :filled="isBookmarked" :width="13" :height="17" />
      </button>

      <!-- Text-selection menu + its popups (Kopírovať/Podobné/Zvýrazniť/Vysvetliť) -->
      <SelectionLayer
        v-if="EDIT_TOOL.MOUSE === docStore.editTool"
        :text-layer-ref="textLayerRef"
        :page-body-ref="pageBodyRef"
        @highlight="handleHighlight"
      />
    </div>
  </div>
</template>
