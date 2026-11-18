// Development harness entry — NOT part of the published library bundle.
// index.html loads this; it mounts the sample App (with example PDFs and stub
// callbacks) so the viewer can be developed in isolation.
import './assets/main.css';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { createViewerI18n } from './assets/lang/i18n';

createApp(App).use(createViewerI18n()).use(createPinia()).mount('#elvira-viewer-app');
