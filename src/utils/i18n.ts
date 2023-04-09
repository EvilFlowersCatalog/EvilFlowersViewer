import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import enJSON from './translations/en.json'

i18n.use(initReactI18next).init({
  returnNull: false,
  fallbackLng: 'en',
  resources: {
    en: { ...enJSON },
  },
  interpolation: {
    escapeValue: false,
  },
  debug: import.meta.env.DEV,
  supportedLngs: ['en', 'sk'],
  defaultNS: 'translations',
})

export default i18n
