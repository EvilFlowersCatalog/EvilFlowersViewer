// Library entry point. This file is the published bundle's entry — keep it free
// of side effects and dev-only imports (App.vue, sample PDFs, examples) so none
// of that ships to consumers. The dev harness lives in ./dev.ts.
import './assets/main.css';
import 'pdfjs-dist/web/pdf_viewer.css';

import { createApp, type App } from 'vue';
import { createPinia } from 'pinia';
import type { IRenderViewerProps } from './assets/utils/interfaces';
import { PDFViewer } from './components';
import i18n from './assets/lang/i18n';

// Type-only exports (erased at runtime, so they don't turn this into a
// mixed named/default bundle). The default export stays the sole runtime
// export to keep the `import renderViewer from '...'` contract unchanged.
export type {
  IViewerProps,
  IViewerOptions,
  IViewerConfig,
  IRenderViewerProps,
  ISuggestedEntry,
  IExplainResult,
} from './assets/utils/interfaces';
export type { SUGGESTION_KIND } from './assets/utils/enums';

/**
 * Imperatively mount the viewer into `rootId`. Each call is fully isolated
 * (its own Pinia store), so multiple viewers can coexist. Returns the Vue app
 * instance so the host can `.unmount()` it on teardown.
 */
const renderPDFViewer = ({
  rootId,
  data,
  options = null,
  config = null,
}: IRenderViewerProps): App => {
  const app = createApp(PDFViewer, { data, options, config });

  app.use(i18n);
  app.use(createPinia());
  app.mount(rootId);

  return app;
};

export default renderPDFViewer;
