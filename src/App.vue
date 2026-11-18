<script setup lang="ts">
import PDFViewer from './components/PDFViewer.vue';
import pdf from './assets/examples/SampleTOC.pdf';
import { onMounted, ref } from 'vue';
import type { IViewerConfig, IViewerOptions } from './assets/utils/interfaces';
import type { TypedArray } from 'pdfjs-dist/types/src/display/api';
import { Loader } from './components/pdf-aids';
import {
  addPageBookmarkFunc,
  closeFunction,
  exampleBookmarkToggleFunction,
  exampleCitation,
  exampleExplainFunction,
  exampleOpenEntryDetailFunction,
  exampleShareFunction,
  exampleSuggestionsFunction,
  getLayerFunc,
  getLayersFunc,
  homeFunction,
  saveLayerFunc,
  updateLayerFunc,
  getGroupsFunc,
  saveGroupFunc,
  examplePrintFunction,
  getPageBookmarksFunc,
  removePageBookmarkFunc,
  exampleChatSendFunction,
  getChatsFunc,
  getChatFunc,
  deleteChatFunc,
  getRegionsFunc,
  getAllRegionsFunc,
  getAgentAnnotationsFunc,
  requestAgentAnnotationFunc,
  deleteAgentHighlightFunc,
  deleteAgentAnnotationFunc,
  exampleEntryId,
} from './assets/examples/params/examples';

const focusPage = Number(new URLSearchParams(window.location.search).get('focus')) || null;

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
  // Passages of SampleTOC.pdf, so the viewer can locate and mark them; `rects`
  // are omitted on purpose to exercise that path.
  semanticSearchFunction: async (query: string) => {
    await new Promise((r) => setTimeout(r, 500));
    return [
      {
        page: 16,
        id: 'sql-history',
        title: '3.1 História SQL',
        text: 'Prvotná verzia jazyka SQL (Structured Query Language) nazývaná ako Sequel',
        reason: `Opisuje vznik jazyka, na ktorý sa pýtate („${query}“).`,
        score: 0.94,
      },
      {
        page: 16,
        id: 'sql-standard',
        title: '3.1 História SQL',
        text: 'Prvý štandard bol vydaný v roku 1986 s označením SQL-86',
        score: 0.88,
      },
      {
        page: 9,
        id: 'intro',
        title: '1 Úvod do databázových systémov',
        text: 'Úvod do databázových systémov',
        score: 0.71,
      },
      { page: 12, id: 'model', title: '2 Dátový model', text: 'Dátový model', score: 0.6 },
    ];
  },
  homeFunction,
  closeFunction,
  openEntryDetailFunction: exampleOpenEntryDetailFunction,
  bookmarkToggleFunction: exampleBookmarkToggleFunction,
  suggestionsFunction: exampleSuggestionsFunction,
  explainFunction: exampleExplainFunction,
  // IP-018 intelligent viewer mocks
  chatPackage: {
    sendMessageFunc: exampleChatSendFunction,
    resetFunc: () => console.log('chat reset'),
    getChatsFunc,
    getChatFunc,
    deleteChatFunc,
    // Evidence citations: this book's open in place, others go to the host.
    entryId: exampleEntryId,
    openCitationFunc: (citation) => console.info('open citation in the host', citation),
  },
  // `?focus=N` opens at a cited paragraph low on page N (outline + flashed sentence).
  initialFocus: focusPage
    ? {
        page: focusPage,
        paragraphId: 'p-demo',
        bbox: { x0: 0.12, y0: 0.7, x1: 0.88, y1: 0.84 },
        quads: [
          { x0: 0.12, y0: 0.74, x1: 0.88, y1: 0.765 },
          { x0: 0.12, y0: 0.765, x1: 0.6, y1: 0.79 },
        ],
      }
    : null,
  regionPackage: { getRegionsFunc, getAllRegionsFunc },
  agentAnnotationPackage: {
    getAnnotationsFunc: getAgentAnnotationsFunc,
    requestAnnotationFunc: requestAgentAnnotationFunc,
    deleteHighlightFunc: deleteAgentHighlightFunc,
    deleteAnnotationFunc: deleteAgentAnnotationFunc,
  },
  editPackage: {
    saveLayerFunc,
    updateLayerFunc,
    getLayerFunc,
    getLayersFunc,
    getGroupsFunc,
    saveGroupFunc,
  },
  pageBookmarkPackage: {
    getBookmarksFunc: getPageBookmarksFunc,
    addBookmarkFunc: addPageBookmarkFunc,
    removeBookmarkFunc: removePageBookmarkFunc,
  },
  lang: 'sk',
  // Host timing hooks (the portal sends these to Faro).
  onFirstPageRendered: (info) => console.info('[viewer] first page rendered', info),
  onDocumentError: (info) => console.warn('[viewer] document error', info),
};

// `?source=url` exercises the streamed path: pdf.js fetches the sample itself,
// with HTTP Range requests when the server allows them. `?url=<pdf>` loads
// another file the same way; the Vite dev server does not answer Range, a
// static server that does will. More switches:
//   `?chunk=16384`   Range chunk size (default: the viewer's 512 KiB)
//   `?streaming=1`   range-only loading (no background prefetch)
//   `?token=<url>`   headers as a function: a Bearer token fetched from <url>,
//                    refreshed whenever the viewer asks again after a 401
//   `?worker=1`      draw pages in the pdf.js renderer worker
const query = new URLSearchParams(window.location.search);
const sourceUrl = query.get('url') ?? pdf;
const useUrl = query.get('source') === 'url' || query.has('url');
const chunk = Number(query.get('chunk')) || null;
const streaming = query.get('streaming') === '1';
const tokenUrl = query.get('token');
let token: string | null = null;
// The test server's tokens expire after 3 requests; like a real host, this
// one keeps its token until the viewer reports a 401 (`retry: true`).
const headers = tokenUrl
  ? async ({ retry }: { retry: boolean }) => {
      if (!token || retry) token = await (await fetch(tokenUrl)).text();
      return { Authorization: `Bearer ${token}` };
    }
  : null;
options.workerRendering = query.get('worker') === '1';
options.onDocumentLoaded = (info) => console.info('[viewer] document loaded', info);
// `?mark=<url>`: ping a test server at first paint, to order it among the ranges.
const markUrl = query.get('mark');
if (markUrl) {
  const report = options.onFirstPageRendered;
  options.onFirstPageRendered = (info) => {
    report?.(info);
    fetch(`${markUrl}?bytes=${info.bytesLoaded}&ms=${info.durationMs}`).catch(() => undefined);
  };
}
options.onLoadProgress = (info) => console.debug('[viewer] progress', info);
// Telemetry to the console (the portal forwards batches to Faro / OTLP).
// `window.efvTelemetry` keeps every exported event for inspection.
const telemetryLog: unknown[] = [];
(window as unknown as { efvTelemetry: unknown[] }).efvTelemetry = telemetryLog;
options.telemetry = {
  flushIntervalMs: 1000,
  export: (batch) => {
    telemetryLog.push(...batch);
    console.debug('[viewer] telemetry', batch.map((e) => e.name).join(', '));
  },
};
options.onPageChange = (info) => console.info('[viewer] page', info);
options.onStreamError = (info) => console.warn('[viewer] stream error', info);
// pdf.js resources served by the dev server straight from node_modules.
options.pdfAssetsUrl = '/node_modules/pdfjs-dist/';

// The controller, for poking at from the console: `viewer.goToPage(5)`.
const viewerRef = ref<{ controller: unknown } | null>(null);
onMounted(() => {
  (window as unknown as { viewer: () => unknown }).viewer = () =>
    viewerRef.value?.controller;
});

onMounted(async () => {
  if (useUrl) return;
  const response = await fetch(pdf);
  const arrayBuffer = await response.arrayBuffer();

  data.value = new Uint8Array(arrayBuffer);
});
</script>

<template>
  <PDFViewer
    v-if="useUrl"
    ref="viewerRef"
    :url="sourceUrl"
    :http-headers="headers"
    :range-chunk-size="chunk"
    :streaming="streaming"
    :config="config"
    :options="options"
  />
  <div v-else-if="!data" class="flex w-screen h-screen justify-center items-center">
    <Loader :size="100" color="#4a9cff" />
  </div>
  <PDFViewer v-else ref="viewerRef" :data="data" :config="config" :options="options" />
</template>
