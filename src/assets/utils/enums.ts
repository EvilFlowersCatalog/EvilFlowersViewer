export enum RENDER_STATE {
  RENDERED,
  RENDERING,
}

export enum LAYER_STATE {
  NOT_READY = 'not-ready',
  LOADING = 'load',
  READY = 'ready',
  SAVING = 'save',
}

export enum SIDEBAR_STATE {
  SEARCH = 'search',
  SHARE = 'share',
  INFO = 'info',
  PRINT = 'print',
  TOC = 'table-of-content',
  NULL = 'NULL',
}

export enum SUGGESTION_KIND {
  SIMILAR = 'similar',
  PREREQUISITE = 'prerequisite',
  ADVANCED = 'advanced',
}

export enum SEARCH_STATE {
  SEARCHING,
  DONE,
  NULL,
}

export enum MODAL_CONTENT {
  NULL = 'NULL',
  TOC = 'table-of-content',
  CITATE = 'citation',
  QRCode = 'qr-code',
}

export enum CITATION_TYPE {
  BIB = 'bib',
  TXT = 'txt',
  RIS = 'ris',
}

export enum CITATION_FORMAT {
  BIBTEX = 'bibtex',
  BIBLATEX = 'biblatex',
  RIS = 'ris',
  TXT = 'bibliography',
}

export enum EDIT_TOOL {
  MOUSE,
  PEN,
  HIGHLIGHTER,
  ERASER,
  CIRCLE,
  RECT,
  LINE,
}
