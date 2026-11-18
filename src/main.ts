// Library entry point. This file is the published bundle's entry — keep it free
// of side effects and dev-only imports (App.vue, sample PDFs, examples) so none
// of that ships to consumers. The dev harness lives in ./dev.ts.
import './assets/main.css';

import { createApp, type App } from 'vue';
import { createPinia } from 'pinia';
import type { IRenderViewerProps, IViewerController } from './assets/utils/interfaces';
import { PDFViewer } from './components';
import { createViewerI18n } from './assets/lang/i18n';

// Type-only exports (erased at runtime, so they don't turn this into a
// mixed named/default bundle). The default export stays the sole runtime
// export to keep the `import renderViewer from '...'` contract unchanged.
export type {
  IViewerProps,
  IViewerOptions,
  IViewerConfig,
  IRenderViewerProps,
  IDocumentSource,
  IPageLayer,
  ISuggestedEntry,
  IExplainResult,
  IExplainContext,
  IPageBookmark,
  IPageBookmarkPackage,
  IPageBox,
  IRegion,
  IRegionPackage,
  REGION_KIND,
  IAgentHighlight,
  IAgentAnnotation,
  IAgentAnnotationPackage,
  INewReaderHighlight,
  IReaderHighlightPackage,
  IChatContext,
  IChatMessage,
  IChatStreamHandlers,
  IChatActivity,
  IChatPackage,
  IChatSummary,
  IChatCitation,
  IViewerFocus,
  IFirstPageRenderedInfo,
  IDocumentErrorInfo,
  IDocumentLoadedInfo,
  ILoadProgressInfo,
  IPageChangeInfo,
  IOutlineEntry,
  NAVIGATION_CAUSE,
  ISemanticSearchResult,
  IHostSearchResult,
  ISearchHit,
  ISearchOptions,
  ISearchSummary,
  ISearchSelectInfo,
  SEARCH_SOURCE,
  ISelectionInfo,
  IStreamErrorInfo,
  IViewerController,
  IViewerEventMap,
  IViewerState,
  VIEWER_ACTION,
  VIEWER_PANEL,
  DOCUMENT_SOURCE_KIND,
  LOAD_ERROR_REASON,
  HttpHeadersSource,
} from './assets/utils/interfaces';
export type {
  ITelemetryEvent,
  ITelemetrySink,
  TELEMETRY_EVENT,
  TelemetryAttributes,
  TelemetryValue,
} from './core/telemetry/types';
export type { SUGGESTION_KIND } from './assets/utils/enums';

/** The mounted viewer: the Vue app (`.unmount()` on teardown) plus its controller (exported type). */
export type ViewerApp = App & { viewer: IViewerController };

/**
 * Imperatively mount the viewer into `rootId` (a CSS selector or an element).
 * Each call is fully isolated (its own Pinia store, i18n and pdf.js worker),
 * so multiple viewers can coexist. Returns the Vue app so the host can
 * `.unmount()` it, with `app.viewer` to drive it afterwards.
 */
const renderPDFViewer = ({ rootId, options = null, config = null, ...source }: IRenderViewerProps): ViewerApp => {
  const app = createApp(PDFViewer, { ...source, options, config });
  app.use(createViewerI18n(options?.lang ?? 'en'));
  app.use(createPinia());
  const root = app.mount(rootId) as unknown as { controller: IViewerController };
  return Object.assign(app, { viewer: root.controller });
};

export default renderPDFViewer;
