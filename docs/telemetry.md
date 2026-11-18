# Telemetry

The viewer reports what happens inside it (how fast documents open and pages paint, how readers navigate
and search, how long each host service takes to answer, when the page stalls) through one interface. It
records nothing until the host passes `options.telemetry`, and it costs nothing when the host doesn't.

## Guarantees

- **No document content, ever.** No text, queries, selections, titles, URLs or answers. A query becomes
  `queryLength`; a selection becomes `length` and `pages`. A host function's arguments and results are never
  read, only its name, duration and whether it failed.
- **Bounded attributes.** Names come from a closed set; attribute values are enums, flags and small numbers,
  so they can become labels (except `page`, which belongs on events or spans, not metric labels).
- **Never in the way.** Events are queued and exported in batches off the hot path. A throwing or rejecting
  exporter is ignored.
- **Nothing lost at the end.** The queue is flushed when the tab is hidden or closed (`visibilitychange`,
  `pagehide`) and on unmount, so an exporter using `navigator.sendBeacon` gets the last events too.

## The sink

```ts
interface ITelemetrySink {
  export: (batch: readonly ITelemetryEvent[]) => void | Promise<void>;
  flushIntervalMs?: number;      // default 5000
  maxBatchSize?: number;         // default 50
  longFrames?: boolean;          // report main-thread stalls, default true
  longFrameThresholdMs?: number; // default 100
}

interface ITelemetryEvent {
  name: TELEMETRY_EVENT;
  time: number;          // epoch ms
  durationMs?: number;   // timed operations
  level: 'info' | 'warn' | 'error';
  sessionId: string;     // random, per mounted viewer
  documentSeq: number;   // 1 for the first document, +1 per controller.open()
  attributes: Record<string, string | number | boolean | null>;
}
```

`controller.setOptions({ telemetry })` swaps or removes the sink at runtime; pending events go to the old one
first.

## Event catalogue

| Event | Duration | Attributes |
| --- | --- | --- |
| `viewer.mount` | | `dpr`, `viewportWidth`, `reducedMotion`, `forcedColors`, `hardwareConcurrency` |
| `viewer.unmount` | session length | `pagesViewed` |
| `document.open` | | `source` (`data` · `url` · `range-transport`), `streaming` |
| `document.loaded` | open → parsed | `totalPages`, `source`, `streaming`, `totalBytes` |
| `document.first_paint` | open → first page on screen | `page`, `source`, `streaming`, `bytesLoaded`, `totalBytes` |
| `document.downloaded` | open → last byte | `totalBytes` |
| `document.error` (error) | open → failure | `stage` (`download` · `parse` · `render`), `reason`, `status`, `source` |
| `document.stream_error` (warn) | | `status` |
| `page.render` | rasterisation | `page`, `kind` (`initial` · `rerender`), `scale`, `pixelRatio`, `textLayerMs` |
| `page.view` | time on the page (≥ 0.5 s) | `page` |
| `navigation` | | `cause` (see `NAVIGATION_CAUSE`), `page`, `totalPages`, `distance` |
| `zoom` | | `scale`, `fitToWidth` |
| `panel.open` | | `panel` |
| `action` | | `action` (`cite` · `share` · `print` · `download` · `info` · `recommendations` · `chat` · `draw` · selection actions) |
| `search` | query → results | `source` (`text` · `semantic` · `host`), `total`, `pages`, `truncated`, `queryLength` |
| `search.select` | | `source`, `index`, `page` |
| `selection` | | `length`, `page`, `pages` |
| `selection.action` | | `action`, `length` |
| `explain` | request → final answer | `nested`, `region`, `outcome` (`ok` · `empty` · `error`), `streamed` |
| `chat.first_token` | send → first streamed text | |
| `host.call` | the call | `fn` (`explainFunction`, `chatPackage.sendMessageFunc`, …), `outcome` (`ok` · `error`) |
| `ui.long_frame` (warn) | the stall | `scope: 'page'`, `entryType`, `blockingMs`, `visible` |
| `ui.error` (error) | | `info` (Vue's error location) |

`ui.long_frame` uses the Long Animation Frames API (Chromium 123+), else Long Tasks; it measures the whole
page, so a stall may come from the host. `page` is an attribute, never a metric label.

## Adapters

### Grafana Faro (elvira-portal)

```ts
import type { ITelemetrySink } from '@evilflowers/evilflowersviewer';

export const faroSink = (faro: Faro): ITelemetrySink => ({
  export: (batch) => {
    for (const e of batch) {
      const context = Object.fromEntries(
        Object.entries({ ...e.attributes, level: e.level, documentSeq: e.documentSeq, sessionId: e.sessionId })
          .map(([k, v]) => [k, String(v)])
      );
      if (e.durationMs !== undefined)
        faro.api.pushMeasurement({ type: `viewer.${e.name}`, values: { duration_ms: e.durationMs } }, { context });
      else faro.api.pushEvent(`viewer.${e.name}`, context);
    }
  },
});
```

### OpenTelemetry (browser SDK)

Timed events map to spans that end at `time`; the rest to span events or log records.

```ts
const tracer = trace.getTracer('evilflowers-viewer');
const otelSink: ITelemetrySink = {
  export: (batch) => {
    for (const e of batch) {
      const end = e.time;
      const span = tracer.startSpan(`viewer.${e.name}`, {
        startTime: end - (e.durationMs ?? 0),
        attributes: { ...e.attributes, 'viewer.session_id': e.sessionId, 'viewer.document_seq': e.documentSeq },
      });
      if (e.level === 'error') span.setStatus({ code: SpanStatusCode.ERROR });
      span.end(end);
    }
  },
};
```

Follow the Elvira telemetry contract on the host side: `service.name` of the host (e.g. `elvira-portal`),
`service.namespace=elvira`, metrics in base units (`viewer_first_paint_seconds`), ids on spans, never in
names or labels.

## Events vs telemetry

Telemetry is for operators. Hosts that need to *react* (sync the URL, enable a back button, ground an AI
prompt in the selection) listen to [viewer events](host-integration.md#events) instead: they carry the full
payload, including the reader's selection, and arrive synchronously.
