<script setup lang="ts">
import { onMounted, toRaw, watch } from 'vue';
import { useDocumentStore } from '@/stores';
import { TextLayer } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { EDIT_TOOL, RENDER_STATE } from '@/assets/utils/enums';
import { Loader } from '../pdf-aids';
import { EditCanvas } from './pdf-edit';

// Data
const docStore = useDocumentStore();
let pdf = toRaw(docStore.pdf);

// Handling dobe clicking
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

// Function to get and render the PDF page
const renderPage = async (renderTextContent: boolean = true) => {
  if (!pdf) return;

  docStore.setRenderState(RENDER_STATE.RENDERING);

  const page = await pdf.getPage(docStore.activePage);
  const viewport = page.getViewport({ scale: docStore.scale });

  docStore.setCanvasHeight(viewport.height);
  docStore.setCanvasWidth(viewport.width);

  const canvas = document.getElementById(
    'pdf-page-canvas'
  ) as HTMLCanvasElement;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  // Render page content to the canvas
  await page.render({
    canvasContext: canvas.getContext('2d') as CanvasRenderingContext2D,
    viewport,
  }).promise;

  if (renderTextContent) {
    // Render text layer for the page
    const container = document.getElementById('textLayer') as HTMLDivElement;
    // Clear container
    container.replaceChildren();

    const textContentSource = await page.getTextContent();
    await new TextLayer({
      textContentSource,
      container,
      viewport,
    }).render();
  }

  // Set state to rendered
  docStore.setRenderState(RENDER_STATE.RENDERED);
};

// Load page on mount
onMounted(() => {
  // Set state to rendering
  renderPage();
});

// Whenever active page or pdf change, re-render page
watch(
  () => [docStore.activePage, pdf, docStore.scale],
  () => {
    renderPage();
  }
);

// When scale change, re-render only canvas not the text
watch(
  () => docStore.reRenderPage,
  () => {
    renderPage(false);
  }
);

// If pdf change, update pdf
watch(
  () => docStore.pdf,
  () => {
    pdf = toRaw(docStore.pdf);
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
      :style="{
        '--scale-factor': docStore.scale,
      }"
    >
      <!-- Cavnas for editing -->
      <EditCanvas
        v-if="docStore.edit"
        :class="
          EDIT_TOOL.MOUSE === docStore.editTool
            ? 'pointer-events-none'
            : 'pointer-events-auto cursor-crosshair'
        "
      />

      <!-- Canvas -->
      <canvas
        class="shadow-[0_0_20px_5px_rgba(0,0,0,0.2)]"
        id="pdf-page-canvas"
      ></canvas>

      <!-- Textlayer content -->
      <div
        id="textLayer"
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
