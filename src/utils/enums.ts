import i18next from 'i18next'

export enum SIDEBAR_TABS {
  SEARCH = 'SEARCH',
  SHARE = 'SHARE',
  INFO = 'INFO',
  NULL = 'NULL',
}

export const SIDEBAR_TAB_NAMES = () => ({
  SEARCH: i18next.t('fullTextSearch'),
  CITATIONS: i18next.t('citations'),
  SHARE: i18next.t('share'),
  INFO: i18next.t('info'),
  DOWNLOAD: i18next.t('download'),
  NULL: i18next.t('null'),
})

export enum RENDERING_STATES {
  RENDERING,
  RENDERED,
}

export enum SEARCH_STATES {
  LOADING,
  DONE,
  ERROR,
}

export enum EDIT_TOOLS {
  MOUSE,
  ERASER,
  PENCIL,
  LINE,
  CIRCLE,
  SQUARE,
}

export const DEBOUNCE_TIMEOUT = 300
