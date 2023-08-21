import i18next from 'i18next'

export enum SIDEBAR_TABS {
  SEARCH = 'SEARCH',
  PEN = 'PEN',
  CITATIONS = 'CITATIONS',
  SHARE = 'SHARE',
  INFO = 'INFO',
  DOWNLOAD = 'DOWNLOAD',
  NULL = 'NULL',
}

export const SIDEBAR_TAB_NAMES = () => ({
  SEARCH: i18next.t('search'),
  PEN: i18next.t('pen'),
  CITATIONS: i18next.t('citations'),
  SHARE: i18next.t('share'),
  INFO: i18next.t('info'),
  DOWNLOAD: i18next.t('download'),
  NULL: i18next.t('null'),
})

export enum RENDERING_STATES {
  LOADING,
  RENDERING,
  RENDERED,
}

export enum SEARCH_STATES {
  LOADING,
  DONE,
  ERROR,
}

export const DEBOUNCE_TIMEOUT = 300
