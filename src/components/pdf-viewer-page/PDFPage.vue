<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue';
import { useDocumentStore } from '@/stores';
import { TextLayer } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PageViewport } from 'pdfjs-dist/types/src/display/page_viewport';
import type { PDFPageProxy } from 'pdfjs-dist/types/src/display/api';
import { EDIT_TOOL, RENDER_STATE } from '@/assets/utils/enums';
import { Loader } from '../pdf-aids';
import { EditCanvas } from './pdf-edit';

const docStore = useDocumentStore();
let pdf = toRaw(docStore.pdf);

// Template refs replace the former global getElementById('pdf-page-canvas' /
// 'textLayer') lookups so several viewers can live on one page.
const canvasRef = ref<HTMLCanvasElement | null>(null);
const textLayerRef = ref<HTMLDivElement | null>(null);

// A single reused render task + TextLayer instance. Keeping the TextLayer lets
// us reflow it on zoom via pdf.js 6's update() instead of rebuilding it.
let renderTask: ReturnType<PDFPageProxy['render']> | null = null;
let textLayer: TextLayer | null = null;
let textLayerPage = 0; // page number the current TextLayer was built for

const handleDoubleClick = () => {
  docStore.setScale(
    docStore.scale > 1.5
      ? 1.5
      : docStore.scale < 1
      ? 1
      : docStore.scale === 1.5
      ? 1
      : 1.5
  );
};

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

const buildTextLayer = async (page: PDFPageProxy, viewport: PageViewport) => {
  const container = textLayerRef.value;
  if (!container) return;

  textLayer?.cancel();
  container.replaceChildren();

  const textContentSource = await page.getTextContent();
  textLayer = new TextLayer({ textContentSource, container, viewport });
  await textLayer.render();
  textLayerPage = docStore.activePage;
};

// Full render: new page (or first paint). Rasterises the canvas and (re)builds
// the text layer from scratch.
const renderPage = async () => {
  if (!pdf) return;
  docStore.renderState = RENDER_STATE.RENDERING;

  const page = await pdf.getPage(docStore.activePage);
  const viewport = page.getViewport({ scale: docStore.scale });
  docStore.canvasWidth = viewport.width;
  docStore.canvasHeight = viewport.height;

  if (!(await paintCanvas(page, viewport))) return; // superseded
  await buildTextLayer(page, viewport);
  drawHighlight(viewport);

  docStore.renderState = RENDER_STATE.RENDERED;
};

// Zoom: re-rasterise the canvas for crispness, but only reflow the existing
// text layer (pdf.js 6 TextLayer.update) rather than re-fetching text content.
const rescale = async () => {
  if (!pdf) return;
  docStore.renderState = RENDER_STATE.RENDERING;

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

  docStore.renderState = RENDER_STATE.RENDERED;
};

// Cheap repaint used when only the search highlight changes on the current
// page: re-rasterise (clears the previous highlight) and draw, no text work and
// no loader flash.
const repaint = async () => {
  if (!pdf) return;
  const page = await pdf.getPage(docStore.activePage);
  const viewport = page.getViewport({ scale: docStore.scale });
  if (await paintCanvas(page, viewport)) drawHighlight(viewport);
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
    class="flex w-full h-full p-5 overflow-auto"
    @dblclick="handleDoubleClick"
  >
    <!-- Loader -->
    <Loader
      v-if="docStore.renderState === RENDER_STATE.RENDERING"
      :size="70"
      color="#4a9cff"
    />

    <!-- Content -->
    <div
      :class="
        docStore.renderState === RENDER_STATE.RENDERING
          ? 'hidden'
          : 'relative m-auto'
      "
      :style="{ '--scale-factor': docStore.scale }"
    >
      <!-- Canvas for editing -->
      <EditCanvas
        v-if="docStore.edit"
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
    </div>
  </div>
</template>
