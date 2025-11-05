import { createI18n } from 'vue-i18n';
import en from './en.json';
import sk from './sk.json';

const messages = {
  en,
  sk,
};

const i18n = createI18n({
  locale: 'en',
  fallbackLocale: 'en',
  messages,
});

export default i18n;
