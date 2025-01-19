export enum RENDER_STATE {
  RENDERED,
  RENDERING,
}

export enum LAYER_STATE {
  SAVING = 'save',
  LOADING = 'load',
  DONE = 'done',
}

export enum SIDEBAR_STATE {
  SEARCH = 'search',
  SHARE = 'share',
  INFO = 'info',
  PRINT = 'print',
  NULL = 'NULL',
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
