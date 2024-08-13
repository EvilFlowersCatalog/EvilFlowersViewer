import i18next from 'i18next'

export enum SIDEBAR_TABS {
  SEARCH = 'SEARCH',
  SHARE = 'SHARE',
  INFO = 'INFO',
  LAYERS = 'LAYERS',
  NULL = 'NULL',
}

export const SIDEBAR_TAB_NAMES = () => ({
  SEARCH: i18next.t('fullTextSearch'),
  SHARE: i18next.t('share'),
  INFO: i18next.t('info'),
  LAYERS: i18next.t('layers'),
  NULL: i18next.t('null'),
})

export enum EDIT_STAGES {
  LOADING,
  WORKING,
  NULL,
  DONE,
}

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
