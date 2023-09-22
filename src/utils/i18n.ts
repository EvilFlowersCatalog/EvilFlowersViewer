import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { en } from './translations/en'
import { sk } from './translations/sk'

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: en.translations,
    },
    sk: {
      translation: sk.translations,
    },
  },
  fallbackLng: 'en',
  debug: false,
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
