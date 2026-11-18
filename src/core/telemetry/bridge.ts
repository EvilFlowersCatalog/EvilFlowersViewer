// Adapter: the viewer's public events become telemetry. This is the one place
// that decides what of an event may leave as telemetry; content (queries,
// selected text) is reduced to lengths here.
import type { EventBus } from '@/core/events/EventBus';
import type { IViewerEventMap } from '@/assets/utils/interfaces';
import type { Telemetry } from './Telemetry';

export const bridgeTelemetry = (bus: EventBus<IViewerEventMap>, telemetry: Telemetry): (() => void) => {
  let openedAt = 0;
  let downloaded = false;
  // Reading time per page: the page on screen and since when.
  let viewing: { page: number; since: number } | null = null;
  const pagesViewed = new Set<number>();
  const mountedAt = performance.now();

  const endView = () => {
    if (!viewing) return;
    const durationMs = performance.now() - viewing.since;
    // Under half a second the reader was passing by, not reading.
    if (durationMs >= 500) telemetry.record('page.view', { page: viewing.page }, { durationMs });
    viewing = null;
  };

  const sinceOpen = () => (openedAt ? performance.now() - openedAt : undefined);

  const offs = [
    bus.on('document-open', ({ source, streaming }) => {
      endView();
      telemetry.nextDocument();
      openedAt = performance.now();
      downloaded = false;
      pagesViewed.clear();
      telemetry.record('document.open', { source, streaming });
    }),
    bus.on('document-loaded', ({ totalPages, source, streaming, totalBytes }) =>
      telemetry.record('document.loaded', { totalPages, source, streaming, totalBytes }, { durationMs: sinceOpen() })
    ),
    bus.on('first-page-rendered', ({ page, source, streaming, bytesLoaded, totalBytes, durationMs }) =>
      telemetry.record('document.first_paint', { page, source, streaming, bytesLoaded, totalBytes }, { durationMs })
    ),
    bus.on('load-progress', ({ loaded, total }) => {
      if (downloaded || total <= 0 || loaded < total) return;
      downloaded = true;
      telemetry.record('document.downloaded', { totalBytes: total }, { durationMs: sinceOpen() });
    }),
    bus.on('document-error', ({ stage, reason, status, source }) =>
      telemetry.record('document.error', { stage, reason, status, source }, { durationMs: sinceOpen(), level: 'error' })
    ),
    bus.on('stream-error', ({ status }) => telemetry.record('document.stream_error', { status }, { level: 'warn' })),
    bus.on('page-change', ({ page, previousPage, cause, totalPages }) => {
      endView();
      viewing = { page, since: performance.now() };
      pagesViewed.add(page);
      telemetry.record('navigation', {
        cause,
        page,
        totalPages,
        distance: previousPage === null ? 0 : Math.abs(page - previousPage),
      });
    }),
    bus.on('scale-change', ({ scale, fitToWidth }) =>
      telemetry.record('zoom', { scale: Math.round(scale * 100) / 100, fitToWidth })
    ),
    bus.on('panel-change', ({ panel }) => {
      if (panel) telemetry.record('panel.open', { panel });
    }),
    bus.on('action', ({ action }) => telemetry.record('action', { action })),
    bus.on('annotation-change', ({ action, kinds, input, count }) =>
      telemetry.record('annotation', { action, kind: kinds.length === 1 ? kinds[0] : 'mixed', input: input ?? null, count })
    ),
    // `search` / `search.select` are recorded by the search store (with timing).
    bus.on('selection-change', (selection) => {
      if (selection)
        telemetry.record('selection', {
          length: selection.text.length,
          page: selection.page,
          pages: selection.segments.length,
        });
    }),
  ];

  // The tab going to the background ends the current page's reading time.
  const onVisibility = () => {
    if (document.visibilityState === 'hidden') endView();
  };
  document.addEventListener('visibilitychange', onVisibility);

  telemetry.record('viewer.mount', {
    dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    viewportWidth: window.innerWidth,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    forcedColors: window.matchMedia?.('(forced-colors: active)').matches ?? false,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
  });

  return () => {
    endView();
    telemetry.record('viewer.unmount', { pagesViewed: pagesViewed.size }, { durationMs: performance.now() - mountedAt });
    document.removeEventListener('visibilitychange', onVisibility);
    offs.forEach((off) => off());
  };
};
