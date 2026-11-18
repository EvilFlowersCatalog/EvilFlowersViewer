// Batching telemetry recorder (the BatchSpanProcessor pattern, without the
// OpenTelemetry dependency). Costs nothing when the host attached no sink:
// `record` returns before building anything, and hot paths check `enabled`.
import type {
  ITelemetryEvent,
  ITelemetrySink,
  TELEMETRY_EVENT,
  TelemetryAttributes,
} from './types';

const randomId = (): string => {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
};

export interface RecordOptions {
  durationMs?: number;
  level?: ITelemetryEvent['level'];
}

export class Telemetry {
  readonly sessionId = randomId();
  #sink: ITelemetrySink | null = null;
  #queue: ITelemetryEvent[] = [];
  #timer: ReturnType<typeof setTimeout> | null = null;
  #documentSeq = 0;
  #detach: (() => void) | null = null;
  #now: () => number;

  constructor(now: () => number = () => Date.now()) {
    this.#now = now;
  }

  get enabled(): boolean {
    return this.#sink !== null;
  }

  get documentSeq(): number {
    return this.#documentSeq;
  }

  /** Attach (or with null, detach) the host's sink. Pending events go to the old one first. */
  setSink(sink: ITelemetrySink | null): void {
    if (sink === this.#sink) return;
    this.flush();
    this.#detach?.();
    this.#detach = null;
    this.#sink = sink;
    if (sink && typeof document !== 'undefined') this.#detach = this.#listenForPageExit();
  }

  /** A new document starts: later events carry the next `documentSeq`. */
  nextDocument(): number {
    return ++this.#documentSeq;
  }

  record(name: TELEMETRY_EVENT, attributes: TelemetryAttributes = {}, options: RecordOptions = {}): void {
    const sink = this.#sink;
    if (!sink) return;
    this.#queue.push({
      name,
      time: this.#now(),
      ...(options.durationMs !== undefined ? { durationMs: Math.round(options.durationMs) } : {}),
      level: options.level ?? 'info',
      sessionId: this.sessionId,
      documentSeq: this.#documentSeq,
      attributes,
    });
    if (this.#queue.length >= (sink.maxBatchSize ?? 50)) this.flush();
    else this.#timer ??= setTimeout(() => this.flush(), sink.flushIntervalMs ?? 5000);
  }

  /** Measures from now until the returned function is called. */
  start(name: TELEMETRY_EVENT, attributes: TelemetryAttributes = {}) {
    if (!this.#sink) return (_extra?: TelemetryAttributes, _options?: RecordOptions) => {};
    const startedAt = performance.now();
    return (extra: TelemetryAttributes = {}, options: RecordOptions = {}) =>
      this.record(name, { ...attributes, ...extra }, { ...options, durationMs: performance.now() - startedAt });
  }

  flush(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    const sink = this.#sink;
    if (!sink || !this.#queue.length) return;
    const batch = this.#queue;
    this.#queue = [];
    try {
      const result = sink.export(batch);
      if (result && typeof (result as Promise<void>).catch === 'function')
        (result as Promise<void>).catch(() => undefined);
    } catch {
      // telemetry must never break reading
    }
  }

  dispose(): void {
    this.flush();
    this.#detach?.();
    this.#detach = null;
    this.#sink = null;
  }

  // The last events of a session are the ones most often lost: send them when
  // the tab goes to the background or is closed (the sink may use sendBeacon).
  #listenForPageExit(): () => void {
    const onHidden = () => {
      if (document.visibilityState === 'hidden') this.flush();
    };
    const onPageHide = () => this.flush();
    document.addEventListener('visibilitychange', onHidden);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onHidden);
      window.removeEventListener('pagehide', onPageHide);
    };
  }
}
