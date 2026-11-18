export enum RENDER_STATE {
  RENDERED,
  RENDERING,
}

export enum SIDEBAR_STATE {
  SEARCH = 'search',
  SHARE = 'share',
  INFO = 'info',
  PRINT = 'print',
  TOC = 'table-of-content',
  PAGES = 'pages',
  HIGHLIGHTS = 'agent-highlights',
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

/**
 * The tool in hand. MOUSE is reading (text selection, links); every other
 * tool belongs to draw mode and turns the page's ink layer interactive.
 */
export enum EDIT_TOOL {
  MOUSE,
  SELECT,
  PEN,
  HIGHLIGHTER,
  SHAPE,
  NOTE,
  ERASER,
}
