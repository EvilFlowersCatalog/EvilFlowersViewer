// Opens documents into the stores: one load at a time (a newer load drops an
// older one), the old document stays on screen until the new one parsed, a
// failed open is classified for the host, and a stream outage can resume.
import { markRaw, ref, watch } from 'vue';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import type { IDocumentSource, ITOCItem, IViewerFocus } from '@/assets/utils/interfaces';
import type { RefreshableRangeTransport } from '@/assets/utils/rangeTransport';
import { SIDEBAR_STATE } from '@/assets/utils/enums';
import { useAssistantStore, useDocumentStore, useSearchStore, useViewerStore } from '@/stores';
import {
  isStreaming,
  prepareSource,
  sourceKind,
  WorkerHandle,
  type LoaderOptions,
} from '@/core/document/documentSource';
import { describeLoadError, failureStage } from '@/core/document/loadErrors';
import { buildToc } from '@/core/document/outline';

export interface OpenAt {
  initialPage?: number | null;
  initialFocus?: IViewerFocus | null;
}

export const useDocumentLoader = (initial: IDocumentSource, initialAt: OpenAt, options: () => LoaderOptions) => {
  const docStore = useDocumentStore();
  const viewerStore = useViewerStore();
  const assistantStore = useAssistantStore();
  const searchStore = useSearchStore();

  const source = ref<IDocumentSource>({ ...initial });
  /** Where the next load opens; navigation before the first load updates it. */
  let openAt: OpenAt = { ...initialAt };
  const failed = ref(false);
  const failReason = ref<string>('load-error-unknown');
  /** Changes with every document shown: views keyed by it start fresh (no stale bitmaps). */
  const documentKey = ref(0);

  const worker = new WorkerHandle(options);
  // The task whose document is on screen, and the one still loading.
  let shownTask: PDFDocumentLoadingTask | null = null;
  let pendingTask: PDFDocumentLoadingTask | null = null;
  let transport: RefreshableRangeTransport | null = null;
  let loadSeq = 0;
  let outline: Promise<ITOCItem[]> | null = null;
  let loadOutline: (() => Promise<ITOCItem[]>) | null = null;
  let stopOutlineWatch: (() => void) | null = null;

  // ---- progress: store every update, tell the host once per frame ----------
  let progressFrame = 0;
  const reportProgress = (loaded: number, total: number) => {
    docStore.downloadProgress = { loaded, total };
    if (progressFrame || !viewerStore.events.has('load-progress')) {
      // Still emit the final byte count (telemetry's `document.downloaded`).
      if (!progressFrame && total > 0 && loaded >= total) viewerStore.events.emit('load-progress', { loaded, total });
      return;
    }
    progressFrame = requestAnimationFrame(() => {
      progressFrame = 0;
      const p = docStore.downloadProgress;
      if (p) viewerStore.events.emit('load-progress', { ...p });
    });
  };

  const dropTasks = () => {
    pendingTask?.destroy();
    pendingTask = null;
    shownTask?.destroy();
    shownTask = null;
  };

  const showDocument = (pdf: PDFDocumentProxy, seq: number) => {
    const at = openAt;
    openAt = {};
    const focus = at.initialFocus;
    const initialPage = Math.trunc(Number(focus?.page || at.initialPage) || 1);

    searchStore.clear(); // results belong to the previous document
    docStore.totalPages = pdf.numPages;
    docStore.pageLabels = null;
    docStore.openAtPage(initialPage);
    docStore.toc = [];
    pdf
      .getPageLabels()
      .then((labels) => {
        // Labels that only repeat the physical numbers add nothing.
        const useful = labels?.some((label, i) => label !== String(i + 1));
        if (seq === loadSeq) docStore.pageLabels = useful ? labels : null;
      })
      .catch(() => undefined);
    // One parsed document serves the page stream and the thumbnails.
    docStore.previewPdf = markRaw(pdf);
    docStore.pdf = markRaw(pdf);
    documentKey.value++;

    // The outline resolves a destination per entry (Range requests when
    // streaming), so it never holds back the first page; with `streaming` it
    // waits until the reader opens the contents.
    outline = null;
    loadOutline = () =>
      (outline ??= pdf
        .getOutline()
        .then((items) => (items ? buildToc(pdf, items) : []))
        .then((toc) => {
          if (seq === loadSeq) docStore.toc = toc;
          return toc;
        })
        .catch((error) => {
          console.error('Failed to read the outline:\n', error);
          return [] as ITOCItem[];
        }));
    stopOutlineWatch?.();
    stopOutlineWatch = null;
    if (docStore.loadInfo.streaming) {
      stopOutlineWatch = watch(
        () => docStore.sidebarState,
        (state) => {
          if (state !== SIDEBAR_STATE.TOC) return;
          stopOutlineWatch?.();
          stopOutlineWatch = null;
          if (seq === loadSeq) loadOutline?.();
        },
        { immediate: true }
      );
    } else loadOutline();

    // Host data that belongs to the document; never awaited before the paint.
    docStore.loadBookmarks();
    assistantStore.reset();
    assistantStore.loadAgentAnnotations();
    if (focus && (focus.bbox || focus.quads?.length || focus.regionId)) {
      assistantStore.focusOn({ ...focus, page: docStore.activePage }, 'initial');
    }
  };

  const load = async () => {
    const seq = ++loadSeq;
    const src = source.value;
    failed.value = false;
    docStore.startDocumentOpen({ source: sourceKind(src), streaming: isStreaming(src) });
    // A load that never opened is dropped right away (book switch mid-load).
    pendingTask?.destroy();
    pendingTask = null;

    try {
      // The worker starts while the first Range request is in flight.
      const [pdfWorker, prepared] = await Promise.all([
        worker.get(),
        prepareSource(src, options(), (status) => {
          if (seq === loadSeq) docStore.reportStreamError(status);
        }),
      ]);
      if (seq !== loadSeq) {
        prepared.transport?.abort(); // superseded while probing
        return;
      }
      if (!prepared.params) throw new Error('Neither `data` nor `url` was given.');

      const task = getDocument({ ...prepared.params, worker: pdfWorker });
      pendingTask = task;
      transport = prepared.transport;
      if (transport) reportProgress(transport.initialData?.length ?? 0, transport.length);
      task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
        if (seq === loadSeq) reportProgress(loaded, total);
      };

      const pdf = await task.promise;
      if (seq !== loadSeq) return;
      // Only now may the previous document go: it was on screen until here.
      const previous = shownTask;
      shownTask = task;
      pendingTask = null;
      previous?.destroy();

      viewerStore.events.emit('document-loaded', {
        totalPages: pdf.numPages,
        ...docStore.loadInfo,
        totalBytes: docStore.downloadProgress?.total || null,
      });
      showDocument(pdf, seq);
    } catch (error) {
      if (seq !== loadSeq) return;
      const { reason, status } = describeLoadError(error);
      failReason.value = reason;
      docStore.reportDocumentError(failureStage(reason, !!(src.url || src.data)), reason, status);
      failed.value = true;
      dropTasks();
      docStore.pdf = null;
      docStore.previewPdf = null;
      console.error('Failed to load the PDF:\n', error);
    }
  };

  /** Swap the document; `at` says where to open it. */
  const open = (next: IDocumentSource, at: OpenAt = {}) => {
    source.value = { ...next };
    openAt = at;
    void load();
  };

  // After a failed open: load again. After a stream error: re-request the
  // ranges that failed (pdf.js still waits for them); pdf.js' own `url` loader
  // cannot resume, so it reopens at the current page.
  const retry = () => {
    if (docStore.streamError && transport && !failed.value) {
      docStore.streamError = null;
      transport.retryFailed();
      return;
    }
    if (docStore.streamError && docStore.pdf) openAt = { initialPage: docStore.activePage };
    void load();
  };

  /** Before the document has loaded, navigation sets where it opens. */
  const setOpenAt = (patch: OpenAt) => {
    openAt = { ...openAt, ...patch };
  };

  const getOutline = () => loadOutline?.() ?? Promise.resolve([] as ITOCItem[]);

  const dispose = () => {
    if (progressFrame) cancelAnimationFrame(progressFrame);
    loadSeq++; // late results of an in-flight load are dropped
    stopOutlineWatch?.();
    dropTasks();
    transport = null;
    void worker.destroy();
    // The store may outlive this component (hot reload, a host remounting
    // it): never leave it pointing at a destroyed document.
    docStore.pdf = null;
    docStore.previewPdf = null;
    searchStore.clear();
  };

  return { source, failed, failReason, documentKey, load, open, retry, setOpenAt, getOutline, dispose };
};
