// Development harness entry — NOT part of the published library bundle.
// index.html loads this; it mounts the sample App (with example PDFs and stub
// callbacks) so the viewer can be developed in isolation.
import './assets/main.css';
import 'pdfjs-dist/web/pdf_viewer.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import i18n from './assets/lang/i18n';

createApp(App).use(i18n).use(createPinia()).mount('#elvira-viewer-app');
