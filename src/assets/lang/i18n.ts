import { createI18n } from 'vue-i18n';
import en from './en.json';
import sk from './sk.json';

const messages = {
  en,
  sk,
};

// Composition API mode (legacy was deprecated in vue-i18n v11).
// `globalInjection` keeps `$t` available in templates; `i18n.global.locale`
// is a writable ref, so assign via `i18n.global.locale.value = ...`.
const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: 'en',
  fallbackLocale: 'en',
  messages,
});

export default i18n;
