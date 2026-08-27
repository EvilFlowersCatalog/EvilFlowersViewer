import type { TypedArray } from 'pdfjs-dist/types/src/display/api';
import type { SUGGESTION_KIND } from './enums';

/** A single semantic/AI search hit returned by the host-provided function. */
export interface ISemanticSearchResult {
  /** 1-based page number the hit points to. */
  page: number;
  /** Snippet of matching text to show in the result card. */
  text: string;
  /** Optional relevance score (0..1); used only for ordering if provided. */
  score?: number;
}

/**
 * A keyword-search hit the page canvas should highlight. Coordinates come from
 * pdf.js `getTextContent` (unscaled, PDF user space) and are scaled to the
 * current zoom by the renderer, so the highlight stays put across re-renders.
 */
export interface ISearchHighlight {
  /** 1-based page the hit belongs to. */
  page: number;
  /** Text-item transform matrix ([a, b, c, d, e, f]). */
  transform: number[];
  /** Text-item width in unscaled PDF units. */
  width: number;
  /** Text-item height in unscaled PDF units. */
  height: number;
}

/** A book/entry card shown in the similar-books and suggestions popups. */
export interface ISuggestedEntry {
  id: string;
  catalog_id: string;
  title: string;
  authors: { name: string; surname: string }[];
  thumbnail: string;
  feeds?: { id: string; title: string }[];
  /** Non-null when bookmarked (on the user's shelf). */
  shelf_record_id?: string | null;
}

/** Result of the host-provided `explainFunction`. */
export interface IExplainResult {
  simple: string;
  examples: { label: string; description: string }[];
}

/** Host hooks for the annotation/edit layer (create + persist SVG layers). */
export interface IEditPackage {
  saveGroupFunc: (name: string) => Promise<{ response: { id: string } }>;
  getGroupsFunc: () => Promise<{ id: string; name: string }[]>;
  saveLayerFunc: (
    svg: string,
    groupId: string,
    page: number
  ) => Promise<ILayer | null>;
  updateLayerFunc: (
    id: string,
    svg: string,
    groupId: string,
    page: number
  ) => Promise<void>;
  getLayerFunc: (page: number, groupId: string) => Promise<ILayer | null> | null;
}

/**
 * A bookmarked page. `id` is the host's record identifier for the bookmark —
 * it is echoed back to `removeBookmarkFunc` so hosts that key deletions by
 * record (rather than by page) don't have to look it up again.
 */
export interface IPageBookmark {
  /** 1-based page number. */
  page: number;
  /** Host record id; null/omitted when the host doesn't issue one. */
  id?: string | null;
}

/**
 * Host hooks for page bookmarks: loaded once per document, then one call per
 * toggle. Omitting the package keeps the bookmark UI usable but session-only
 * (nothing is persisted).
 */
export interface IPageBookmarkPackage {
  /** All bookmarks for the open document. Called once after the PDF loads. */
  getBookmarksFunc: () => Promise<IPageBookmark[]>;
  /** Persists a new bookmark; resolve with the stored record to keep its id. */
  addBookmarkFunc: (page: number) => Promise<IPageBookmark | null>;
  /** Removes the bookmark for `page`; `id` is the one returned when it was added. */
  removeBookmarkFunc: (page: number, id?: string | null) => Promise<void>;
}

export interface IViewerOptions {
  theme?: 'dark' | 'light';
  lang?: 'sk' | 'en';
  citationBib?: string | null;
  homeFunction?: (() => void) | null;
  closeFunction?: (() => void) | null;
  shareFunction?:
    | ((pages: string | null, expaireDate: string) => Promise<string>)
    | null;
  printFunction?: ((pages: string | null) => Promise<string>) | null;
  /**
   * Optional semantic/AI search. When supplied, the search panel shows a
   * second column with these results next to the client-side keyword matches.
   * When omitted, the panel stays keyword-only.
   */
  semanticSearchFunction?:
    | ((query: string) => Promise<ISemanticSearchResult[]>)
    | null;
  editPackage?: IEditPackage | null;
  /**
   * Optional persistence for per-page bookmarks. Without it the bookmark
   * button still works, but the marks live only as long as the viewer.
   */
  pageBookmarkPackage?: IPageBookmarkPackage | null;
  /** Opens the host's entry-detail overlay for a clicked card. */
  openEntryDetailFunction?: ((entry: ISuggestedEntry) => void) | null;
  /** Toggles the shelf bookmark; resolves with the settled state. */
  bookmarkToggleFunction?:
    | ((
        entry: ISuggestedEntry
      ) => Promise<{ isOnShelf: boolean; shelfRecordId?: string | null }>)
    | null;
  /** Opt-in suggestions feed. Omitting it hides "Podobné" and the bottom-right button. */
  suggestionsFunction?:
    | ((
        kind: SUGGESTION_KIND,
        context?: { selectedText?: string; page?: number }
      ) => Promise<ISuggestedEntry[]>)
    | null;
  /** Opt-in "explain this passage" feed. Omitting it hides "Vysvetliť". */
  explainFunction?: ((selectedText: string) => Promise<IExplainResult>) | null;
}

export interface IViewerProps {
  data: TypedArray;
  options?: IViewerOptions;
  config?: IViewerConfig;
}

export interface IViewerConfig {
  download?: boolean;
  share?: boolean;
  print?: boolean;
  edit?: boolean;
}

export interface IRenderViewerProps {
  rootId: string;
  data: TypedArray;
  options?: IViewerOptions | null;
  config?: IViewerConfig | null;
}

export interface IPDFMetadataProps {
  Author?: string;
  Title?: string;
  Pages?: number;
  CreationDate?: string;
  ModificationDate?: string;
  Description?: string;
  Identificator?: number;
  Creator?: string;
  Keywords?: string;
  Producer?: string;
  Subject?: string;
  Language?: string;
  PDFFormatVersion?: string;
}

export interface ITOCItem {
  isExpanded: any;
  title: string;
  pageNumber: number;
  level: number;
  children: ITOCItem[];
}

export interface IPDFOutlineItem {
  title: string;
  bold: boolean;
  italic: boolean;
  color: Uint8ClampedArray;
  dest: string | any[] | null;
  url: string | null;
  unsafeUrl: string | undefined;
  newWindow: boolean | undefined;
  count: number | undefined;
  items: IPDFOutlineItem[] | undefined;
}

export interface ILayer {
  id: string;
  svg: string;
}
