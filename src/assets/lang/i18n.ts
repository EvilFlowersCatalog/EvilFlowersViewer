import { createI18n } from 'vue-i18n';
import en from './en.json';
import sk from './sk.json';

export const SUPPORTED_LANGS = ['en', 'sk'] as const;
export type ViewerLang = (typeof SUPPORTED_LANGS)[number];

/**
 * One i18n instance per mounted viewer, so two viewers on a page can speak
 * different languages and `setLang` on one never switches the other.
 * Composition mode; `$t` stays available in templates (`globalInjection`).
 */
export const createViewerI18n = (locale: string = 'en') =>
  createI18n({
    legacy: false,
    globalInjection: true,
    locale,
    fallbackLocale: 'en',
    messages: { en, sk },
  });
