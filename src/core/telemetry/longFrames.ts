// Main-thread stalls, for `ui.long_frame`. Uses the Long Animation Frames API
// (Chromium 123+) and falls back to Long Tasks; elsewhere it does nothing.
// These entries are page-global: a stall may come from the host page, not the
// viewer, which is why the event says `scope: 'page'`.
import type { Telemetry } from './Telemetry';

export const observeLongFrames = (telemetry: Telemetry, thresholdMs = 100): (() => void) => {
  if (typeof PerformanceObserver === 'undefined') return () => {};
  const supported = PerformanceObserver.supportedEntryTypes ?? [];
  const type = supported.includes('long-animation-frame')
    ? 'long-animation-frame'
    : supported.includes('longtask')
      ? 'longtask'
      : null;
  if (!type) return () => {};

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration < thresholdMs) continue;
      const blocking = (entry as PerformanceEntry & { blockingDuration?: number }).blockingDuration;
      telemetry.record(
        'ui.long_frame',
        {
          scope: 'page',
          entryType: type,
          ...(blocking !== undefined ? { blockingMs: Math.round(blocking) } : {}),
          visible: document.visibilityState === 'visible',
        },
        { durationMs: entry.duration, level: 'warn' }
      );
    }
  });
  try {
    observer.observe({ type, buffered: false });
  } catch {
    return () => {};
  }
  return () => observer.disconnect();
};
