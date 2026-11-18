import type { TypedArray } from 'pdfjs-dist/types/src/display/api';
import type { SUGGESTION_KIND } from './enums';
import type { ITelemetrySink } from '@/core/telemetry/types';

/** A single semantic/AI search hit returned by the host-provided function. */
export interface ISemanticSearchResult {
  /** 1-based page number the hit points to. */
  page: number;
  /**
   * Snippet of matching text to show in the result card. Without `rects` the
   * viewer looks for this text on `page` and highlights it where found.
   */
  text: string;
  /** Optional relevance score (0..1); used only for ordering if provided. */
  score?: number;
  /** Stable id, echoed back in `onSearchResultSelect`. */
  id?: string;
  /** Short heading of the card, e.g. the section the passage is from. */
  title?: string;
  /** Why it matched, shown under the snippet (e.g. an AI explanation). */
  reason?: string;
  /** Exact boxes to highlight on `page` (page fractions, top-left origin). */
  rects?: IPageBox[];
}

/** Results the host pushes into the viewer (`controller.showResults`), e.g. passages an AI answer used. */
export type IHostSearchResult = ISemanticSearchResult;

export type SEARCH_SOURCE = 'text' | 'semantic' | 'host';

export interface ISearchOptions {
  /** Match upper/lower case exactly. Default false. */
  caseSensitive?: boolean;
  /** Only whole words. Default false. */
  wholeWord?: boolean;
  /** "databaz" also finds "databáz". Default true. */
  ignoreDiacritics?: boolean;
}

/** One search result as the viewer shows and highlights it. */
export interface ISearchHit {
  id: string;
  source: SEARCH_SOURCE;
  page: number;
  /** Boxes to highlight (page fractions); empty when the text was not located. */
  rects: IPageBox[];
  /** The snippet, split around the matched part. */
  before: string;
  match: string;
  after: string;
  title?: string;
  reason?: string;
  score?: number;
}

export interface ISearchSummary {
  query: string;
  source: SEARCH_SOURCE;
  total: number;
  /** Number of distinct pages with a hit. */
  pages: number;
  /** True when the hit list was cut at the limit. */
  truncated: boolean;
}

export interface ISearchSelectInfo {
  source: SEARCH_SOURCE;
  /** 0-based index within its source's results. */
  index: number;
  page: number;
  /** The host's or semantic result's `id`, when it had one. */
  id: string | null;
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

/**
 * Result of the host-provided `explainFunction`. Only `simple` is required;
 * every other part adds a section to the Explain card when present.
 */
export interface IExplainResult {
  /** A plain-language explanation (markdown). */
  simple: string;
  examples?: { label: string; description: string }[];
  /** A longer, more technical explanation (markdown): the card's "In depth". */
  detailed?: string | null;
  /** Key terms of the passage with one-line definitions. */
  terms?: { term: string; definition: string }[];
  /**
   * Where else this publication covers it. Without it the viewer asks
   * `semanticSearchFunction` (when the host has one) for related passages.
   */
  related?: ISemanticSearchResult[];
  /** Questions the reader may want to ask next; each opens the chat with it. */
  followUps?: string[];
}

/** What `explainFunction` gets besides the text. `regionId` is set when a figure/table/equation is explained. */
export interface IExplainContext {
  page?: number;
  regionId?: string;
  /** Aborted when the reader closes the card or explains something else: stop the request. */
  signal?: AbortSignal;
  /**
   * Stream the result: call it with what has arrived so far (e.g. `simple`
   * growing), as often as you like; the card updates in place. The returned
   * promise still resolves with the final result.
   */
  onPartial?: (partial: Partial<IExplainResult>) => void;
  /**
   * The explanation the reader was reading when they selected this text in
   * the Explain card itself ("explain the explanation"); absent for text from
   * the page.
   */
  parent?: { text: string; explanation: string } | null;
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
  /** What clients show: the printed caption, else the model's description. */
  caption?: string | null;
  /** The caption printed in the document ("Figure 2.1: ..."), verbatim. */
  printedCaption?: string | null;
  /** A description written by a multimodal model, when captions are on. */
  description?: string | null;
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
  /** Every region of the copy, for the Figures tab of the contents. Omitting it hides the tab. */
  getAllRegionsFunc?: () => Promise<IRegion[]>;
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
  /** `reader` for the reader's own text highlights, listed beside the agent's. */
  kind?: 'agent' | 'reader';
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
  /**
   * Resolves once an annotation the chat started is finished (done or failed).
   * Without it the viewer reloads `getAnnotationsFunc` until it is.
   */
  waitForAnnotationFunc?: ((annotationId: string) => Promise<IAgentAnnotation>) | null;
  deleteHighlightFunc?: ((annotationId: string, highlightId: string) => Promise<void>) | null;
  deleteAnnotationFunc?: ((annotationId: string) => Promise<void>) | null;
}

/** A text highlight the reader makes from the selection menu ("Zvýrazniť"). */
export interface INewReaderHighlight {
  /** 1-based page in the reader's numbering. */
  page: number;
  text: string;
  /** One box per text line, page fractions. */
  quads: IPageBox[];
}

/**
 * Host hooks for the reader's own text highlights. With it, "Zvýrazniť" stores
 * the selection's text and position (listed under "My highlights" beside the
 * AI highlights, steppable like them) instead of painting it on the drawing
 * layer. Omitting it keeps the drawing-layer behaviour.
 */
export interface IReaderHighlightPackage {
  /** The reader's highlights of the open document. Called once after the PDF loads. */
  getHighlightsFunc: () => Promise<IAgentHighlight[]>;
  /** Stores a new highlight; resolves with it as stored (its id). */
  addHighlightFunc: (highlight: INewReaderHighlight) => Promise<IAgentHighlight>;
  deleteHighlightFunc?: ((highlightId: string) => Promise<void>) | null;
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
  /** Agent annotations the assistant created with this answer, by id. */
  annotationIds?: string[];
  /** Tool calls of the turn this answer closed, for chats read back from history (the activity log). */
  activities?: IChatActivity[];
  /** What the evidence labels `[E3]` / `[F2]` in `text` point to. Labels without one stay plain text. */
  citations?: IChatCitation[];
  status?: 'streaming' | 'done' | 'error';
}

/**
 * The passage or figure behind an evidence label of an answer (`[E3]` a passage,
 * `[F2]` a figure, table or equation). Boxes are page fractions, top-left origin.
 */
export interface IChatCitation {
  /** `E3`, `F2`, as the answer text writes it. */
  label: string;
  /** Publication cited. The open one (`IChatPackage.entryId`) is jumped to in place. */
  entryId: string;
  title?: string;
  /** 1-based page in the reader's numbering. */
  page?: number;
  section?: string;
  /** `passage`, or `figure` / `table` / `equation` for an `F#` label. */
  kind?: string;
  paragraphId?: string;
  regionId?: string;
  /** The paragraph's or region's box on `page`. */
  bbox?: IPageBox;
  /** One box per line of the cited sentence. */
  quads?: IPageBox[];
  /** The page `quads` are on, when the sentence runs onto the next page. */
  sentencePage?: number;
  /** The cited sentence, shown in the chip's hover card. */
  quote?: string;
  /** A figure's caption, shown in the hover card. */
  caption?: string;
  /** A figure's crop, shown in the hover card. */
  imageUrl?: string;
  /** False when the reader cannot open the publication here (it has to be borrowed). */
  readable?: boolean;
}

/**
 * A spot to bring into view and point out: the paragraph or region box is
 * outlined and the sentence flashed, then both fade. Nothing is stored.
 */
export interface IViewerFocus {
  /** 1-based page of `bbox` (and of `quads`, unless `quadsPage` says otherwise). */
  page?: number;
  paragraphId?: string;
  /** A region of `regionPackage`; without `bbox` its own box is used. */
  regionId?: string;
  bbox?: IPageBox;
  quads?: IPageBox[];
  /** The page the `quads` are on, when it is not `page`. */
  quadsPage?: number;
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
  /** An agent annotation the assistant started (the assistant `annotation` event), usually pending. */
  onAnnotation?: (annotation: IAgentAnnotation) => void;
  /**
   * One-line progress label ("Thinking…", "Searching the catalog…"), already
   * translated by the host. Shown under the last message until text streams or
   * the turn ends.
   */
  onStatus?: (label: string) => void;
  /**
   * A tool call of this turn, for the activity log. Sent twice per call:
   * `done: false` when it starts, `done: true` (same `id`) when it finished.
   */
  onActivity?: (activity: IChatActivity) => void;
  /**
   * What the answer's evidence labels point to. May come more than once; a
   * later citation replaces an earlier one with the same label.
   */
  onCitations?: (citations: IChatCitation[]) => void;
  onError: (detail: string) => void;
}

/**
 * One tool call the assistant made while answering, shown in the collapsible
 * activity log above the answer. Only kept for the current session; chats
 * loaded from history show no log.
 */
export interface IChatActivity {
  /** Stable per call within the turn; the `done: true` update replaces the start. */
  id: string;
  /** Raw tool name, never shown. */
  tool: string;
  /** Translated past-tense verb phrase, e.g. "Searched the catalog", "Read the publication". */
  label: string;
  /** Readable query/request the model used. */
  query?: string;
  /** Pages read or matched. */
  pages?: number[];
  /** Number of results. */
  count?: number;
  /** Publications found; only the titles are shown. */
  entries?: { id?: string; title: string }[];
  error?: boolean;
  done: boolean;
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
  /** Id of the open publication. Citations of it are opened in place, the rest go to `openCitationFunc`. */
  entryId?: string | null;
  /** Opens a citation of another publication. Without it such citations are not clickable. */
  openCitationFunc?: ((citation: IChatCitation) => void) | null;
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
  /**
   * Optional bulk loader: every layer of the group in one request. When given,
   * the viewer warms its layer cache once on entering edit mode and page flips
   * no longer fetch; pages missing from the result have no layer. If it fails,
   * the viewer falls back to `getLayerFunc` per page.
   */
  getLayersFunc?: ((groupId: string) => Promise<IPageLayer[]>) | null;
}

/** A layer together with the 1-based page it belongs to (`getLayersFunc`). */
export interface IPageLayer extends ILayer {
  page: number;
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
  /** Title shown in the top bar; defaults to the PDF's own title metadata. */
  title?: string | null;
  theme?: 'dark' | 'light';
  lang?: 'sk' | 'en';
  /** 1-based page to open the document at, e.g. a page a chat citation pointed to. */
  initialPage?: number | null;
  /**
   * Opens at a cited paragraph or figure: scrolls its box into view, outlines it
   * and flashes the sentence's `quads`, then fades. `page` wins over `initialPage`.
   */
  initialFocus?: IViewerFocus | null;
  citationBib?: string | null;
  homeFunction?: (() => void) | null;
  closeFunction?: (() => void) | null;
  shareFunction?:
    | ((pages: string | null, expaireDate: string) => Promise<string>)
    | null;
  /**
   * A link to a place in the open publication, for people who can already
   * read it: it grants nothing (unlike `shareFunction`, which shares access).
   * With it, the selection menu gets "Copy link" and the Share card "Link to
   * this page". The host decides what the link is; the viewer never builds
   * one and never puts the selected text in it. A rejection copies nothing.
   */
  linkFunction?: ((target: ILinkTarget) => Promise<string>) | null;
  printFunction?: ((pages: string | null) => Promise<string>) | null;
  /**
   * Optional semantic/AI search. When supplied, the search panel shows a
   * second column with these results next to the client-side keyword matches.
   * When omitted, the panel stays keyword-only.
   */
  semanticSearchFunction?:
    | ((
        query: string,
        context?: { page: number }
      ) => Promise<ISemanticSearchResult[]>)
    | null;
  /** A search finished (in the document, semantic, or host results shown). */
  onSearch?: ((summary: ISearchSummary) => void) | null;
  /** The reader picked a search result (click, Enter, ‹ ›). */
  onSearchResultSelect?: ((info: ISearchSelectInfo) => void) | null;
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
  /** Opt-in list of the reader's own text highlights (shares the agent layer). */
  readerHighlightPackage?: IReaderHighlightPackage | null;
  /**
   * Called once per opened document, when its first page has been painted.
   * `durationMs` runs from the start of the load inside the viewer to the paint.
   * Carries no document content, so it is safe to send to telemetry.
   */
  onFirstPageRendered?: ((info: IFirstPageRenderedInfo) => void) | null;
  /**
   * Called at most once per opened document, when it fails before its first
   * page is painted. Carries the failing stage only.
   */
  onDocumentError?: ((info: IDocumentErrorInfo) => void) | null;
  /**
   * Called once per opened document, as soon as pdf.js has parsed it (before
   * the first paint). Carries no document content.
   */
  onDocumentLoaded?: ((info: IDocumentLoadedInfo) => void) | null;
  /**
   * Bytes received for the open document. With `data` it never fires; with
   * `url` it runs from the first byte until the whole file is in (or, with
   * `streaming`, only while ranges arrive). Throttled to one call per frame.
   */
  onLoadProgress?: ((info: ILoadProgressInfo) => void) | null;
  /** Called whenever the page on screen changes, including the initial page. */
  onPageChange?: ((info: IPageChangeInfo) => void) | null;
  /**
   * Called when a Range request fails after the document opened (network
   * drop, expired authorisation). The viewer shows a "reconnect" notice; the
   * host may refresh its credentials and call `controller.retry()`.
   */
  onStreamError?: ((info: IStreamErrorInfo) => void) | null;
  /**
   * Base URL the host serves the pdf.js resource folders from: `wasm/`,
   * `cmaps/`, `standard_fonts/` and `iccs/` of the matching `pdfjs-dist`
   * (copied verbatim, trailing slash included). Without it, JPX/JBIG2 scans
   * decode on the slower JS fallback where one exists, and PDFs with CJK
   * CMaps or non-embedded standard fonts may render with wrong glyphs.
   */
  pdfAssetsUrl?: string | null;
  /**
   * Opt-in: draw pages in a separate renderer worker (pdf.js 6.5+), keeping
   * the main thread free for scrolling, chat and annotation layers. Falls
   * back to main-thread drawing where OffscreenCanvas is unavailable.
   */
  workerRendering?: boolean;
  /**
   * URL of `pdfjs-dist/legacy/build/pdf.worker.min.mjs` (same version as the
   * viewer's) served by the host, e.g. next to `pdfAssetsUrl`. Without it the
   * viewer loads its bundled copy (a ~1.7 MB chunk with a `data:` worker);
   * with it that chunk is never downloaded and the browser can cache the file.
   */
  pdfWorkerUrl?: string | null;
  /**
   * Where telemetry goes (see `ITelemetrySink`). Batched; never carries
   * document content. Without it the viewer records nothing.
   */
  telemetry?: ITelemetrySink | null;
  /**
   * Single-key shortcuts (F, T, C, …). `auto` (default): active while focus
   * is in this viewer, or on the page body when this was the last viewer used
   * (several viewers on one page don't all react). `off`: none, for hosts with
   * their own shortcuts (WCAG 2.1.4). Ctrl/Cmd shortcuts and Escape stay.
   */
  keyboardShortcuts?: 'auto' | 'off';
  /**
   * Describe the open publication to reference managers (Zotero Connector,
   * Mendeley importer), from `citationBib`: Highwire `citation_*` <meta> tags in
   * the document head (removed on unmount, skipped when the page already has
   * them) and a COinS span in the viewer. Default true; false for hosts that
   * publish their own metadata.
   */
  citationMetadata?: boolean;
  /** The reader's text selection changed (null: cleared). For AI features of the host. */
  onSelectionChange?: ((selection: ISelectionInfo | null) => void) | null;
}

/** How the open document reached the viewer. */
export type DOCUMENT_SOURCE_KIND = 'data' | 'url' | 'range-transport';

export interface IFirstPageRenderedInfo {
  /** 1-based page that was painted first (the initial page). */
  page: number;
  /**
   * From the start of the load inside the viewer to the paint. With `data`
   * this excludes the host's own download; compare streaming against data
   * with the host's click-to-paint time.
   */
  durationMs: number;
  source: DOCUMENT_SOURCE_KIND;
  /** `true` when range-only loading (`streaming`) was requested. */
  streaming: boolean;
  /** Bytes received when the page was painted, when known. */
  bytesLoaded: number | null;
  /** File size in bytes, when known. */
  totalBytes: number | null;
}

export interface IDocumentErrorInfo {
  /** `download`: the file could not be fetched; `parse`: not a readable PDF; `render`: the first page failed to paint. */
  stage: 'download' | 'parse' | 'render';
  /** Machine-readable reason, also the i18n key the viewer shows. */
  reason: LOAD_ERROR_REASON;
  /** HTTP status of the failed request, when the failure was an HTTP one. */
  status: number | null;
  source: DOCUMENT_SOURCE_KIND;
}

export type LOAD_ERROR_REASON =
  | 'load-error-password'
  | 'load-error-invalid'
  | 'load-error-network'
  | 'load-error-auth'
  | 'load-error-not-found'
  | 'load-error-unknown';

export interface IDocumentLoadedInfo {
  totalPages: number;
  source: DOCUMENT_SOURCE_KIND;
  streaming: boolean;
  /** File size in bytes, when known. */
  totalBytes: number | null;
}

export interface ILoadProgressInfo {
  loaded: number;
  /** 0 when the server did not announce a length. */
  total: number;
}

/**
 * Why the page changed. `link`, `outline`, `search`, `citation` and `host`
 * are jumps: they are recorded in the back/forward history.
 */
export type NAVIGATION_CAUSE =
  | 'initial' // the document opened
  | 'step' // previous/next page (keys, arrows, host nextPage/previousPage)
  | 'input' // the page number typed in the bottom bar
  | 'thumbnail' // a thumbnail in the bottom strip
  | 'link' // a link inside the PDF
  | 'outline' // the table of contents
  | 'search' // a search result
  | 'citation' // a chat citation, region, highlight or focus target
  | 'history' // back / forward
  | 'host' // the host's controller (goToPage, goToLabel, goToDestination)
  | 'scroll'; // the reader scrolled another page into view (no history)

export interface IPageChangeInfo {
  page: number;
  totalPages: number;
  /** The PDF's own label of the page ("iv", "12"), when it defines labels. */
  pageLabel: string | null;
  /** The page before this change; null when the document just opened. */
  previousPage: number | null;
  cause: NAVIGATION_CAUSE;
  canGoBack: boolean;
  canGoForward: boolean;
}

/** One entry of the document's outline (table of contents). */
export interface IOutlineEntry {
  title: string;
  /** 1-based target page; null when the entry has no resolvable target. */
  page: number | null;
  /** Depth, 0 for top-level entries. */
  level: number;
  children: IOutlineEntry[];
}

export interface IStreamErrorInfo {
  /** HTTP status of the failed Range request; null for a network failure. */
  status: number | null;
}

/**
 * Request headers for `url`: a fixed object, or a function the viewer calls
 * before every request so the host can hand out a current token. With a
 * function the viewer fetches the ranges itself; a 401/403 is retried once,
 * asking for headers with `{ retry: true }` so the host refreshes its token
 * instead of returning the cached one.
 */
export type HttpHeadersSource =
  | Record<string, string>
  | ((context: {
      retry: boolean;
    }) => Record<string, string> | Promise<Record<string, string>>);

/**
 * Where the PDF comes from. Pass either `data` (the bytes, already in memory)
 * or `url`. With `url`, pdf.js fetches the file itself and, when the server
 * answers HTTP Range requests, renders page 1 before the rest has downloaded.
 *
 * Never pass a single-use URL: pdf.js first opens a full GET to read the
 * response headers, aborts it, then issues Range requests to the same URL.
 */
export interface IDocumentSource {
  data?: TypedArray | null;
  url?: string | null;
  /** Extra request headers for `url`, e.g. `Authorization`. See {@link HttpHeadersSource}. */
  httpHeaders?: HttpHeadersSource | null;
  /** Send cookies with cross-origin `url` requests. */
  withCredentials?: boolean;
  /**
   * Bytes per Range request. Default 524288 (512 KiB) with `url`, which keeps
   * a 7 MB book to ~14 requests; pdf.js's own default (64 KiB) means ~100,
   * each through the host's authorisation.
   */
  rangeChunkSize?: number | null;
  /**
   * File size in bytes, if the host knows it. Used with a function
   * `httpHeaders` when the server's 206 carries no total in `Content-Range`
   * (pdf.js' own `url` loader has no such option in 6.x).
   */
  length?: number | null;
  /**
   * Range-only loading for `url`: pdf.js fetches just what the open page
   * needs (`disableAutoFetch` + `disableStream`). Best for huge scans;
   * full-text search, print and download then trigger many Range requests.
   * Off by default: after page 1 the rest is fetched in the background.
   */
  streaming?: boolean;
}

export interface IViewerProps extends IDocumentSource {
  options?: IViewerOptions;
  config?: IViewerConfig;
}

/** A sidebar panel the host can open. */
export type VIEWER_PANEL =
  | 'search'
  | 'share'
  | 'info'
  | 'print'
  | 'toc'
  | 'pages'
  | 'highlights';

export interface IViewerState {
  page: number;
  totalPages: number;
  pageLabel: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  scale: number;
  theme: 'dark' | 'light';
  lang: string;
  /** `loading`, `ready` (first page painted) or `failed`. */
  status: 'loading' | 'ready' | 'failed';
  /** Background download progress, null before the first byte or with `data`. */
  progress: ILoadProgressInfo | null;
  search: {
    query: string;
    source: SEARCH_SOURCE;
    total: number;
    /** 0-based index of the selected hit, or null. */
    active: number | null;
  };
}

/**
 * Imperative control of a mounted viewer, returned by `renderViewer` as
 * `app.viewer`. Every method is safe to call before the document has loaded:
 * navigation is clamped and applied once pages exist.
 */
export interface IViewerController {
  /** Swap the document without remounting. Callbacks and config are kept. */
  open: (
    source: IDocumentSource,
    at?: { initialPage?: number | null; initialFocus?: IViewerFocus | null }
  ) => void;
  /** Reload after a failure, or re-request ranges after a stream error. */
  retry: () => void;
  /**
   * Jump to a 1-based page (clamped). Recorded in the history, so the reader
   * can go back. Before the document has loaded it sets the opening page.
   */
  goToPage: (page: number) => void;
  /**
   * Jump to the page the PDF labels `label` (e.g. "iv", "12"; printed page
   * numbers differ from physical ones in most books). Resolves to the page,
   * or null when no page has that label (or the document has not loaded).
   */
  goToLabel: (label: string) => Promise<number | null>;
  /** Jump to a named destination of the PDF (`#nameddest=`). Resolves like `goToLabel`. */
  goToDestination: (name: string) => Promise<number | null>;
  nextPage: () => void;
  previousPage: () => void;
  /** Back / forward through jumps (links, outline, search, citations, host jumps). */
  back: () => void;
  forward: () => void;
  /**
   * The document's outline with resolved pages, e.g. for the host's own
   * table of contents. Empty when the PDF has none.
   */
  getOutline: () => Promise<IOutlineEntry[]>;
  /** Scroll to and outline a cited paragraph or figure (same shape as `initialFocus`). */
  focus: (target: IViewerFocus) => void;
  setScale: (scale: number) => void;
  /** `null` drops the host's choice: the reader's stored choice or the system theme applies. */
  setTheme: (theme: 'dark' | 'light' | null) => void;
  setLang: (lang: 'sk' | 'en') => void;
  /** Open a sidebar panel, or close the open one with `null`. */
  openPanel: (panel: VIEWER_PANEL | null) => void;
  /**
   * Search the document's text, highlight every hit and go to the first one
   * at or after the current page. Also asks `semanticSearchFunction` (when the
   * host has one) for related passages, which arrive on their own. Resolves
   * when the text search finished. `openPanel: false` keeps the results list
   * closed (the find bar still steps through the hits).
   */
  search: (
    query: string,
    options?: ISearchOptions & { openPanel?: boolean }
  ) => Promise<ISearchSummary>;
  searchNext: () => void;
  searchPrevious: () => void;
  /** Clear the query, results and highlights. */
  clearSearch: () => void;
  /**
   * Show the host's own results, e.g. passages an AI answer is based on:
   * listed in their own tab (`label`), highlighted on their pages (by
   * `rects`, else by locating `text` on the page) and stepped with ‹ ›.
   * Resolves with how many could be placed on their page.
   */
  showResults: (
    results: IHostSearchResult[],
    options?: { label?: string; select?: number | null; openPanel?: boolean }
  ) => Promise<ISearchSummary>;
  /**
   * The current state. Immutable and cached: the same object is returned
   * until something in it changes, so it can be used as a snapshot
   * (`useSyncExternalStore(viewer.subscribe, viewer.getState)` in React).
   */
  getState: () => IViewerState;
  /** Called after every state change (coalesced per tick). Returns the unsubscribe function. */
  subscribe: (listener: () => void) => () => void;
  /** Listen to one viewer event (see `IViewerEventMap`). Returns the unsubscribe function. */
  on: <K extends keyof IViewerEventMap>(event: K, listener: (payload: IViewerEventMap[K]) => void) => () => void;
  /**
   * Replace some options without remounting: services (`explainFunction`,
   * packages…), callbacks, `telemetry`, `title`, `lang`, `citationBib`,
   * `keyboardShortcuts`. Keys left out stay; a key set to null removes it.
   */
  setOptions: (options: Partial<IViewerOptions>) => void;
  /** The reader's current text selection, or null. */
  getSelection: () => ISelectionInfo | null;
  clearSelection: () => void;
  /**
   * The text of one page (1-based), in reading order with line breaks, for
   * grounding AI features in what the reader sees. Cached per document.
   */
  getPageText: (page: number) => Promise<string>;
}

/**
 * Text the reader selected. `segments` lists the boxes per page (a selection
 * may run onto the next page); boxes are page fractions, top-left origin,
 * one per text line.
 */
export interface ISelectionInfo {
  text: string;
  /** Page the selection starts on. */
  page: number;
  segments: { page: number; boxes: IPageBox[] }[];
}

/** What `linkFunction` links to: a page, or a selection on it. */
export interface ILinkTarget {
  /** 1-based page. */
  page: number;
  selection?: ISelectionInfo;
}

/** A top-bar or selection action the reader ran. */
export type VIEWER_ACTION =
  | 'cite'
  | 'share'
  | 'print'
  | 'download'
  | 'info'
  | 'fullscreen'
  | 'theme'
  | 'recommendations'
  | 'chat'
  | 'draw'
  | 'copy'
  | 'highlight'
  | 'explain'
  | 'ask'
  | 'similar'
  | 'search-selection'
  | 'copy-link';

/**
 * Events of a mounted viewer, `app.viewer.on(name, listener)`. The same
 * payloads go to the matching `options.on*` callbacks. None of them carries
 * document content except `selection-change` (the reader's own selection,
 * for AI features of the host); telemetry never receives that text.
 */
export interface IViewerEventMap {
  'document-open': { source: DOCUMENT_SOURCE_KIND; streaming: boolean };
  'document-loaded': IDocumentLoadedInfo;
  'first-page-rendered': IFirstPageRenderedInfo;
  'document-error': IDocumentErrorInfo;
  'load-progress': ILoadProgressInfo;
  'stream-error': IStreamErrorInfo;
  'page-change': IPageChangeInfo;
  'scale-change': { scale: number; fitToWidth: boolean };
  'theme-change': { theme: 'dark' | 'light' };
  'panel-change': { panel: VIEWER_PANEL | 'cite' | null };
  search: ISearchSummary;
  'search-select': ISearchSelectInfo;
  'selection-change': ISelectionInfo | null;
  action: { action: VIEWER_ACTION };
  'annotation-change': IAnnotationChangeInfo;
}

/**
 * The reader changed their drawings (the annotation layer) on one page. No
 * content: what changed is read from the layer the host stores
 * (`editPackage`), where every object carries its kind, note and the text
 * under it (`data-efv-*`), for search or AI features of the host.
 */
export interface IAnnotationChangeInfo {
  /** 1-based page. */
  page: number;
  action: 'add' | 'change' | 'remove' | 'undo' | 'redo';
  /** Kinds of the objects changed: pen, highlighter, rect, ellipse, line, arrow, mark, note. */
  kinds: string[];
  /** Objects on the page afterwards. */
  count: number;
  /** What drew it, for `add`. */
  input?: 'pen' | 'mouse' | 'touch' | 'keyboard';
}

export interface IViewerConfig {
  download?: boolean;
  share?: boolean;
  print?: boolean;
  edit?: boolean;
}

export interface IRenderViewerProps extends IDocumentSource {
  /** Where to mount: a CSS selector (e.g. `#viewer`) or the element itself. */
  rootId: string | Element;
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
