<script setup lang="ts">
import PDFViewer from './components/PDFViewer.vue';
import pdf from './assets/examples/SampleTOC.pdf';
import { onMounted, ref } from 'vue';
import type { IViewerConfig, IViewerOptions } from './assets/utils/interfaces';
import type { TypedArray } from 'pdfjs-dist/types/src/display/api';
import { Loader } from './components/pdf-aids';
import {
  closeFunction,
  exampleBookmarkToggleFunction,
  exampleCitation,
  exampleExplainFunction,
  exampleOpenEntryDetailFunction,
  exampleShareFunction,
  exampleSuggestionsFunction,
  getLayerFunc,
  homeFunction,
  saveLayerFunc,
  updateLayerFunc,
  getGroupsFunc,
  saveGroupFunc,
  examplePrintFunction,
} from './assets/examples/params/examples';

const data = ref<TypedArray | null>(null);
const config: IViewerConfig = {
  download: true,
  share: true,
  print: true,
  edit: true,
};
const options: IViewerOptions = {
  citationBib: exampleCitation,
  shareFunction: exampleShareFunction,
  printFunction: examplePrintFunction,
  // Dev stub for semantic search — returns a few fake hits after a short delay
  // so the two-column search layout can be exercised locally.
  semanticSearchFunction: async (query: string) => {
    await new Promise((r) => setTimeout(r, 500));
    return [
      { page: 3, text: `Sémanticky podobné k „${query}“: úvod do témy.`, score: 0.94 },
      { page: 8, text: `Kontext súvisiaci s „${query}“ v kapitole 2.`, score: 0.88 },
      { page: 21, text: `Ďalšia relevantná pasáž pre „${query}“.`, score: 0.79 },
    ];
  },
  homeFunction,
  closeFunction,
  openEntryDetailFunction: exampleOpenEntryDetailFunction,
  bookmarkToggleFunction: exampleBookmarkToggleFunction,
  suggestionsFunction: exampleSuggestionsFunction,
  explainFunction: exampleExplainFunction,
  editPackage: {
    saveLayerFunc,
    updateLayerFunc,
    getLayerFunc,
    getGroupsFunc,
    saveGroupFunc,
  },
  lang: 'sk',
};

onMounted(async () => {
  const response = await fetch(pdf);
  const arrayBuffer = await response.arrayBuffer();

  data.value = new Uint8Array(arrayBuffer);
});
</script>

<template>
  <div v-if="!data" class="flex w-screen h-screen justify-center items-center">
    <Loader :size="100" color="#4a9cff" />
  </div>
  <PDFViewer v-else :data="data" :config="config" :options="options" />
</template>
