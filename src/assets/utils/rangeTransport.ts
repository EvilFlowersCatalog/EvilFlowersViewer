// Range loading with headers the host can refresh mid-read.
//
// pdf.js' own `url` loader takes `httpHeaders` once, for the whole document:
// when the host's bearer token expires while a reader is still on the book,
// every later chunk gets 401 and the document breaks. Here the viewer fetches
// the ranges itself, asks the host for headers before each request, and
// retries a 401/403 once with headers asked for again.
import { PDFDataRangeTransport } from 'pdfjs-dist/legacy/build/pdf.mjs';

type Headers = Record<string, string>;
/** `retry` is true when the previous attempt got 401/403: refresh the token. */
export type HeaderProvider = (context: {
  retry: boolean;
}) => Headers | Promise<Headers>;

/** An HTTP failure with its status, so the viewer can tell auth from network. */
export class HttpStatusError extends Error {
  readonly status: number;
  constructor(status: number, url: string) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpStatusError';
    this.status = status;
  }
}

const isAuthStatus = (status: number) => status === 401 || status === 403;

interface FetchOptions {
  url: string;
  headers: HeaderProvider;
  withCredentials: boolean;
  signal: AbortSignal;
  /** The refresh in flight, shared by every request that hit 401 meanwhile. */
  refreshing?: Promise<Headers> | null;
  /** Headers from the last refresh, and the refresh count they belong to. */
  refreshed?: { headers: Headers; generation: number } | null;
}

// Ranges are requested in parallel, so an expired token fails several at
// once: they all share one `{ retry: true }` call instead of each refreshing
// the token. A request sent before the last refresh just reuses its result.
const refreshedHeaders = async (
  options: FetchOptions,
  sentAtGeneration: number
): Promise<Headers> => {
  const last = options.refreshed;
  if (last && last.generation > sentAtGeneration) return last.headers;
  if (!options.refreshing) {
    const generation = (last?.generation ?? 0) + 1;
    options.refreshing = Promise.resolve(options.headers({ retry: true }))
      .then((headers) => {
        options.refreshed = { headers, generation };
        return headers;
      })
      .finally(() => (options.refreshing = null));
  }
  return options.refreshing;
};

// One GET, retried once on 401/403 with refreshed headers.
const fetchWithFreshHeaders = async (
  options: FetchOptions,
  extra: Headers
): Promise<Response> => {
  const { url, withCredentials, signal } = options;
  // The refresh generation the first attempt's headers belong to.
  let sentAt = 0;
  for (let attempt = 0; ; attempt++) {
    let headers: Headers;
    if (attempt === 0) {
      // Don't send a token that is being replaced right now.
      if (options.refreshing) await options.refreshing.catch(() => undefined);
      sentAt = options.refreshed?.generation ?? 0;
      headers = await options.headers({ retry: false });
    } else {
      headers = await refreshedHeaders(options, sentAt);
    }
    const response = await fetch(url, {
      headers: { ...headers, ...extra },
      credentials: withCredentials ? 'include' : 'same-origin',
      signal,
    });
    if (isAuthStatus(response.status) && attempt === 0) continue;
    if (!response.ok) throw new HttpStatusError(response.status, url);
    return response;
  }
};

// "bytes 0-524287/6712345" → 6712345; "*" or junk → null.
const totalFromContentRange = (value: string | null): number | null => {
  const match = value?.match(/\/(\d+)\s*$/);
  return match ? Number(match[1]) : null;
};

class RefreshableRangeTransport extends PDFDataRangeTransport {
  #options: FetchOptions;
  #controller: AbortController;
  #failed = new Map<number, number>(); // begin → end of ranges to re-request
  #onError: (status: number | null) => void;

  constructor(
    length: number,
    initialData: Uint8Array,
    options: FetchOptions,
    controller: AbortController,
    onError: (status: number | null) => void
  ) {
    super(length, initialData);
    this.#options = options;
    this.#controller = controller;
    this.#onError = onError;
  }

  // pdf.js asks for [begin, end), end exclusive.
  requestDataRange(begin: number, end: number) {
    void this.#load(begin, end);
  }

  async #load(begin: number, end: number) {
    try {
      const response = await fetchWithFreshHeaders(this.#options, {
        Range: `bytes=${begin}-${end - 1}`,
      });
      const chunk = new Uint8Array(await response.arrayBuffer());
      if (this.#controller.signal.aborted) return;
      // A server that ignores Range answers 200 with the whole file.
      const slice =
        response.status === 200 ? chunk.subarray(begin, end) : chunk;
      this.#failed.delete(begin);
      try {
        this.onDataRange(begin, slice);
      } catch {
        // pdf.js no longer waits for this range (its reader was cancelled).
      }
    } catch (error) {
      if (this.#controller.signal.aborted) return;
      this.#failed.set(begin, end);
      this.#onError(error instanceof HttpStatusError ? error.status : null);
    }
  }

  /** Re-request every range that failed. pdf.js keeps waiting for them. */
  retryFailed() {
    const pending = [...this.#failed];
    this.#failed.clear();
    for (const [begin, end] of pending) void this.#load(begin, end);
  }

  abort() {
    this.#controller.abort();
  }
}

export type RangeSource =
  | { kind: 'range'; transport: RefreshableRangeTransport; length: number }
  | { kind: 'data'; data: Uint8Array };

/**
 * Probe the file with its first chunk: the 206 carries the total length, and
 * the bytes double as pdf.js' initial data (one request instead of pdf.js'
 * aborted full GET). A server that ignores Range sends the whole file; it is
 * then handed to pdf.js as `data`.
 */
export const openRangeSource = async (args: {
  url: string;
  headers: HeaderProvider;
  withCredentials: boolean;
  chunkSize: number;
  length?: number | null;
  onError: (status: number | null) => void;
}): Promise<RangeSource> => {
  const controller = new AbortController();
  const options: FetchOptions = {
    url: args.url,
    headers: args.headers,
    withCredentials: args.withCredentials,
    signal: controller.signal,
  };
  const response = await fetchWithFreshHeaders(options, {
    Range: `bytes=0-${args.chunkSize - 1}`,
  });
  const initial = new Uint8Array(await response.arrayBuffer());

  const length =
    response.status === 206
      ? totalFromContentRange(response.headers.get('Content-Range')) ??
        args.length ??
        null
      : null;
  // 200: the server ignored Range and sent the whole file.
  if (response.status !== 206) return { kind: 'data', data: initial };
  if (length !== null && initial.length >= length)
    return { kind: 'data', data: initial.subarray(0, length) };
  if (length === null) {
    // A partial answer without a usable length: fetch the file whole.
    const whole = await fetchWithFreshHeaders(options, {});
    return { kind: 'data', data: new Uint8Array(await whole.arrayBuffer()) };
  }

  return {
    kind: 'range',
    length,
    transport: new RefreshableRangeTransport(
      length,
      initial,
      options,
      controller,
      args.onError
    ),
  };
};

export type { RefreshableRangeTransport };
