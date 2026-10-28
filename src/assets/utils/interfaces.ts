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

/** What `explainFunction` gets besides the text. `regionId` is set when a figure/table/equation is explained. */
export interface IExplainContext {
  page?: number;
  regionId?: string;
}

/**
 * A rectangle on a page as fractions (0..1) of the page width and height,
 * origin top-left (IP-018 "Coordinates"). Fractions survive any zoom level.
 */
export interface IPageBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type REGION_KIND = 'figure' | 'table' | 'equation';

/** A figure, table or equation the catalog found on a page (IP-018 regions API). */
export interface IRegion {
  id: string;
  kind: REGION_KIND;
  /** 1-based page in the reader's numbering. */
  page: number;
  bbox: IPageBox;
  caption?: string | null;
  /** chart | photo | diagram | map | ... (figures only). */
  category?: string | null;
  /** Tables only. */
  markdown?: string | null;
  /** Equations only. */
  latex?: string | null;
  /** Authorized crop URL. Without it the viewer crops the rendered page itself. */
  imageUrl?: string | null;
}

/** Host hooks for extracted regions. Omitting the package turns region hover off. */
export interface IRegionPackage {
  /** Regions on one reader page. Called once per page and cached. */
  getRegionsFunc: (page: number) => Promise<IRegion[]>;
}

/** One sentence the assistant marked, an `AnnotationItem` of an agent annotation. */
export interface IAgentHighlight {
  id: string;
  /** Reading order inside the annotation. */
  seq: number;
  /** 1-based page in the reader's numbering. */
  page: number;
  /** One box per text line the sentence covers. */
  quads: IPageBox[];
  text: string;
  note?: string | null;
}

/** An `Annotation` of kind `agent`: the prompt, a summary and its ordered highlights. */
export interface IAgentAnnotation {
  id: string;
  title: string;
  prompt: string;
  summary?: string | null;
  status: 'pending' | 'done' | 'failed';
  /** Quotes the agent returned that could not be found on the page. */
  unresolvedCount?: number;
  highlights: IAgentHighlight[];
}

/** Host hooks for agent annotations. Omitting the package hides the layer and its sidebar. */
export interface IAgentAnnotationPackage {
  /** All agent annotations of the open document. Called once after the PDF loads. */
  getAnnotationsFunc: () => Promise<IAgentAnnotation[]>;
  /** Asks the agent to highlight the book for `prompt`; resolves with the finished annotation. */
  requestAnnotationFunc?: ((prompt: string) => Promise<IAgentAnnotation>) | null;
  deleteHighlightFunc?: ((annotationId: string, highlightId: string) => Promise<void>) | null;
  deleteAnnotationFunc?: ((annotationId: string) => Promise<void>) | null;
}

/**
 * Something the reader attached to a chat message. The open publication itself
 * is always the chat's subject and is never sent as a context.
 */
export type IChatContext =
  | { kind: 'selection'; text: string; page: number }
  | { kind: 'explain'; text: string; page: number; explanation: string; regionId?: string }
  | { kind: 'region'; region: IRegion }
  | { kind: 'highlight'; annotationId: string; highlight: IAgentHighlight };

export interface IChatMessage {
  id: string;
  role: 'user' | 'assistant';
  /**
   * Markdown. Assistant text may cite `[[page:12]]` and `[[region:<id>]]`,
   * which the viewer renders as links into the book.
   */
  text: string;
  contexts?: IChatContext[];
  /** Publications the assistant recommended with this message. */
  entries?: ISuggestedEntry[];
  /** Pages the answer was drawn from, shown as links under it. */
  pages?: number[];
  status?: 'streaming' | 'done' | 'error';
}

/** Stream callbacks, the same events the portal reads from the assistant SSE. */
export interface IChatStreamHandlers {
  /** Partial answer text, appended. */
  onChunk: (text: string) => void;
  /** The complete answer, replacing everything received so far. */
  onMessage: (text: string) => void;
  /** Publications to show as cards (the assistant's book recommendation tool). */
  onEntries: (entries: ISuggestedEntry[]) => void;
  /** Pages the answer was drawn from (the assistant `pages` event). */
  onPages?: (pages: number[]) => void;
  onError: (detail: string) => void;
}

/** One past conversation in the chat history list. */
export interface IChatSummary {
  id: string;
  title: string;
  /** ISO date of the last message. */
  updatedAt: string;
  messageCount?: number;
  /** True when the chat is about the publication open in the viewer. Others are read-only here. */
  aboutThisBook: boolean;
}

/** Host hooks for the reading chat. Omitting the package hides the chat. */
export interface IChatPackage {
  /**
   * Sends one message; resolves when the stream is finished. `chatId` is the
   * conversation to continue, or null to start a new one; resolve with the id
   * the message went to so follow-ups continue it.
   */
  sendMessageFunc: (
    message: string,
    contexts: IChatContext[],
    handlers: IChatStreamHandlers,
    meta: { page: number; chatId: string | null }
  ) => Promise<{ chatId: string } | void>;
  /** Forget the conversation so the next message starts a new chat. */
  resetFunc?: (() => void) | null;
  /** Prompt shortcuts shown in an empty chat; defaults are used when omitted. */
  suggestions?: string[] | null;
  /** The reader's past chats, newest first. With `getChatFunc`, enables the history view. */
  getChatsFunc?: (() => Promise<IChatSummary[]>) | null;
  /** All messages of one past chat, oldest first. */
  getChatFunc?: ((chatId: string) => Promise<IChatMessage[]>) | null;
  /** Deletes a past chat. Omitting it hides the delete buttons. */
  deleteChatFunc?: ((chatId: string) => Promise<void>) | null;
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
  /** 1-based page to open the document at, e.g. a page a chat citation pointed to. */
  initialPage?: number | null;
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
  explainFunction?:
    | ((selectedText: string, context?: IExplainContext) => Promise<IExplainResult>)
    | null;
  /** Opt-in reading chat about the open publication. */
  chatPackage?: IChatPackage | null;
  /** Opt-in figure/table/equation hover. */
  regionPackage?: IRegionPackage | null;
  /** Opt-in agent highlight layer. */
  agentAnnotationPackage?: IAgentAnnotationPackage | null;
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
