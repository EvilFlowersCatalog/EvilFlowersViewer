// Public telemetry contract of the viewer.
//
// Rules every event follows (Elvira telemetry contract):
// - `name` comes from the closed set below; ids never go into names.
// - Attribute values are bounded (enums, flags, small numbers). A page
//   number is an attribute, never a metric label.
// - No document content: never text, queries, selections, titles or URLs.
//   Where size matters the event carries a length (`queryLength`).
// - Durations are milliseconds (`durationMs`); sizes are bytes.

export type TELEMETRY_EVENT =
  // lifecycle
  | 'viewer.mount' // the viewer mounted
  | 'viewer.unmount' // the viewer unmounted (attributes: dwell, pages viewed)
  | 'document.open' // a load started
  | 'document.loaded' // pdf.js parsed the document (durationMs from open)
  | 'document.first_paint' // the first page is on screen (durationMs from open)
  | 'document.downloaded' // every byte arrived (durationMs from open)
  | 'document.error' // the document failed before its first paint
  | 'document.stream_error' // a Range request failed after it opened
  // rendering
  | 'page.render' // one page rasterised (durationMs: paint; textLayerMs)
  | 'page.view' // the reader left a page (durationMs: time on it)
  // interaction
  | 'navigation' // the page changed (cause, distance)
  | 'zoom' // the scale changed
  | 'panel.open' // a Navigator section or action card opened
  | 'action' // a top-bar action ran (cite, share, print, download, …)
  | 'search' // a search finished (durationMs, total, queryLength)
  | 'search.select' // a search hit was picked
  | 'selection' // the reader selected text (length, pages)
  | 'selection.action' // a selection menu action ran
  | 'explain' // an explanation finished (durationMs, outcome)
  | 'chat.first_token' // first streamed answer text (durationMs from send)
  // host integration
  | 'host.call' // a host function returned (fn, durationMs, outcome)
  // health
  | 'ui.long_frame' // the page's main thread was blocked (page-global)
  | 'ui.error'; // a viewer component threw (caught by the error boundary)

export type TelemetryValue = string | number | boolean | null;
export type TelemetryAttributes = Record<string, TelemetryValue>;

export interface ITelemetryEvent {
  name: TELEMETRY_EVENT;
  /** Wall-clock time of the event, epoch milliseconds. */
  time: number;
  /** For timed operations, in milliseconds. */
  durationMs?: number;
  level: 'info' | 'warn' | 'error';
  /** Random per mounted viewer: groups a reading session. */
  sessionId: string;
  /** 1-based count of documents opened in this session (a swap increments it). */
  documentSeq: number;
  attributes: TelemetryAttributes;
}

/**
 * Where telemetry goes. The viewer batches events and calls `export` with
 * one or more of them: every `flushIntervalMs`, when `maxBatchSize` is
 * reached, when the tab is hidden or closed, and on unmount. Never awaited;
 * a throwing or rejecting exporter is ignored.
 */
export interface ITelemetrySink {
  export: (batch: readonly ITelemetryEvent[]) => void | Promise<void>;
  /** Default 5000. */
  flushIntervalMs?: number;
  /** Default 50. */
  maxBatchSize?: number;
  /** Report main-thread stalls (`ui.long_frame`). Default true. */
  longFrames?: boolean;
  /** Only stalls longer than this, ms. Default 100. */
  longFrameThresholdMs?: number;
}
