// Turns the host's document source into pdf.js `getDocument` parameters, and
// owns the pdf.js worker. No Vue, no stores.
import { GlobalWorkerOptions, PDFWorker } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { DocumentInitParameters } from 'pdfjs-dist/types/src/display/api';
import type { DOCUMENT_SOURCE_KIND, IDocumentSource } from '@/assets/utils/interfaces';
import { openRangeSource, type RefreshableRangeTransport } from '@/assets/utils/rangeTransport';
import { assetUrls } from './assetUrls';

/** 512 KiB: a 7 MB book in ~14 Range requests instead of ~100 at pdf.js' 64 KiB. */
export const DEFAULT_RANGE_CHUNK = 512 * 1024;

export const sourceKind = (src: IDocumentSource): DOCUMENT_SOURCE_KIND =>
  src.url ? (typeof src.httpHeaders === 'function' ? 'range-transport' : 'url') : 'data';

export const isStreaming = (src: IDocumentSource): boolean => !!(src.url && src.streaming);

export interface LoaderOptions {
  /** Base URL of the pdf.js resource folders (IViewerOptions.pdfAssetsUrl). */
  pdfAssetsUrl?: string | null;
  /** URL of `pdf.worker.min.mjs` served by the host (IViewerOptions.pdfWorkerUrl). */
  pdfWorkerUrl?: string | null;
  /** IViewerOptions.workerRendering. */
  workerRendering?: boolean;
}

// ---- workers ----------------------------------------------------------------
// The bundled worker is a lazily imported chunk (inlined as a data: URL, so
// hosts need no extra file and no CSP change beyond `worker-src data:`). A
// host that serves the file itself (`pdfWorkerUrl`) never downloads the chunk.
let bundledWorker: Promise<string> | null = null;
const bundledWorkerSrc = () =>
  (bundledWorker ??= import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url').then(
    (m) => m.default,
    (error) => {
      bundledWorker = null; // a failed chunk load may succeed on Retry
      throw error;
    }
  ));

// Pages are drawn in the renderer worker only when the host opts in; its
// script is a separate chunk, too.
let rendererReady: Promise<boolean> | null = null;
const ensureRenderer = () =>
  (rendererReady ??= import('pdfjs-dist/legacy/build/pdf.renderer.min.mjs?url')
    .then(({ default: src }) => {
      GlobalWorkerOptions.rendererSrc = src;
      return true;
    })
    .catch((error) => {
      console.warn('Renderer worker unavailable, drawing on the main thread:\n', error);
      return false;
    }));

/**
 * One pdf.js worker per mounted viewer, reused for every document it opens:
 * switching books no longer pays for starting a worker and compiling its
 * ~1 MB script. Created on first use, destroyed with the viewer.
 */
export class WorkerHandle {
  #worker: Promise<PDFWorker> | null = null;
  readonly #options: () => LoaderOptions;

  constructor(options: () => LoaderOptions) {
    this.#options = options;
  }

  get(): Promise<PDFWorker> {
    const worker = (this.#worker ??= (async () => {
      const hosted = this.#options().pdfWorkerUrl;
      GlobalWorkerOptions.workerSrc = hosted || (await bundledWorkerSrc());
      return new PDFWorker();
    })());
    // A worker that failed to start is not kept: Retry starts a new one.
    worker.catch(() => {
      if (this.#worker === worker) this.#worker = null;
    });
    return worker;
  }

  async destroy(): Promise<void> {
    const pending = this.#worker;
    this.#worker = null;
    (await pending?.catch(() => null))?.destroy();
  }
}

export interface PreparedSource {
  params: DocumentInitParameters | null;
  transport: RefreshableRangeTransport | null;
}

/**
 * Everything pdf.js needs to open `src` (the caller adds the `worker`). With a function `httpHeaders` the
 * viewer fetches ranges itself (refreshable auth); a server without Range
 * support yields the whole file as `data`.
 */
export const prepareSource = async (
  src: IDocumentSource,
  options: LoaderOptions,
  onStreamError: (status: number | null) => void
): Promise<PreparedSource> => {
  const useRenderer = options.workerRendering === true && (await ensureRenderer());
  const common: Partial<DocumentInitParameters> = {
    ...assetUrls(options.pdfAssetsUrl),
    // The viewer renders no forms or AnnotationLayer, so PDF JavaScript has no
    // way in (CVE-2026-16633 needs `enableScripting`); XFA stays off as well.
    enableXfa: false,
    disableWorkerRendering: !useRenderer,
    ...(isStreaming(src) ? { disableAutoFetch: true, disableStream: true } : {}),
  };
  const chunk = src.rangeChunkSize || DEFAULT_RANGE_CHUNK;

  if (src.url && typeof src.httpHeaders === 'function') {
    const opened = await openRangeSource({
      url: src.url,
      headers: src.httpHeaders,
      withCredentials: src.withCredentials ?? false,
      chunkSize: chunk,
      length: src.length,
      onError: onStreamError,
    });
    if (opened.kind === 'data') return { params: { ...common, data: opened.data }, transport: null };
    return { params: { ...common, range: opened.transport, rangeChunkSize: chunk }, transport: opened.transport };
  }
  if (src.url) {
    return {
      params: {
        ...common,
        url: src.url,
        httpHeaders: (src.httpHeaders as Record<string, string>) ?? undefined,
        withCredentials: src.withCredentials ?? false,
        rangeChunkSize: chunk,
      },
      transport: null,
    };
  }
  // Copy: pdf.js transfers the buffer to its worker; the host keeps its bytes.
  if (src.data) return { params: { ...common, data: new Uint8Array(src.data) }, transport: null };
  return { params: null, transport: null };
};
