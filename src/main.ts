import './assets/main.css';
import 'pdfjs-dist/web/pdf_viewer.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import type { IRenderViewerProps } from './assets/utils/interfaces';
import { PDFViewer } from './components';
import App from './App.vue';
import i18n from './assets/lang/i18n';

const app = createApp(App);

app.use(i18n);
app.use(createPinia());
app.mount('#app');

const renderPDFViewer = ({
  rootId,
  data,
  options = null,
  config = null,
}: IRenderViewerProps) => {
  const app = createApp(PDFViewer, { data, options, config });

  app.use(i18n);
  app.use(createPinia());
  app.mount(rootId);
};

export default renderPDFViewer;
