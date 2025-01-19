<script setup lang="ts">
import PDFViewer from './components/PDFViewer.vue';
import pdf from './assets/examples/SampleTOC.pdf';
import { onMounted, ref } from 'vue';
import type { IViewerConfig, IViewerOptions } from './assets/utils/interfaces';
import type { TypedArray } from 'pdfjs-dist/types/src/display/api';
import { Loader } from './components/pdf-aids';
import {
  closeFunction,
  exampleCitation,
  exampleShareFunction,
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
  homeFunction,
  closeFunction,
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
