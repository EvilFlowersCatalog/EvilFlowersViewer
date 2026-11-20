# Host integration

Everything a host application can pass to the viewer, ask of it and hear from it. All types are exported from
the package (`import type { IViewerOptions, … } from '@evilflowers/evilflowersviewer'`).

- [Mounting](#mounting)
- [The document source](#the-document-source)
- [Options](#options)
- [The controller](#the-controller)
- [Events](#events)
- [AI features](#ai-features)
- [Reference managers](#reference-managers)
- [Performance and the bundle](#performance-and-the-bundle)
- [Security and CSP](#security-and-csp)

## Mounting

```ts
const app = renderViewer({ rootId, data | url, httpHeaders?, withCredentials?, rangeChunkSize?, length?, streaming?, options?, config? });
app.viewer; // IViewerController
app.unmount();
```

`rootId` is a CSS selector or an element. Every call is isolated (its own store, translations and pdf.js
worker), so several viewers can share a page; single-key shortcuts go to the one used last.

`config` switches actions on: `{ download?, share?, print?, edit? }`, all false by default (`share` and `print`
also need their functions).

## The document source

Pass `data` (the bytes) or `url`.

With `url`, pdf.js fetches the file in HTTP Range requests and paints page 1 before the rest has arrived. The
server must answer `Accept-Ranges: bytes` and `206`, and, cross-origin, expose `Accept-Ranges, Content-Range,
Content-Length` through CORS.

| Field | |
| --- | --- |
| `data` | `Uint8Array` (any TypedArray) with the PDF. The viewer copies it; the host keeps its bytes. |
| `url` | The PDF's address. **Never a single-use URL**: pdf.js may request it several times. |
| `httpHeaders` | Object, or a function `({ retry }) => headers` called before every request. With a function the viewer fetches ranges itself: a 401/403 is retried once with `{ retry: true }` (concurrent failures share one refresh), so a token expiring mid-read is renewed. |
| `withCredentials` | Send cookies cross-origin. |
| `rangeChunkSize` | Bytes per Range request, default 524288 (pdf.js: 65536, ~100 requests for a 7 MB book). |
| `length` | File size, for servers whose 206 carries no total (function `httpHeaders` only). |
| `streaming` | Range-only loading: no background prefetch after page 1. Best for very large scans; search, print and download then cause many requests, and the contents are read when first opened. |

A Range request that fails after the document opened shows a **Reconnect** notice and emits `stream-error`.
`controller.retry()` re-requests the missing ranges (function `httpHeaders`) or reopens at the current page.

How much page 1 needs depends on the file. In local tests pdf.js read most sample files whole before opening
them; measure on real files (`first-page-rendered` carries `bytesLoaded` and `totalBytes`).

## Options

### Presentation

| Option | |
| --- | --- |
| `title` | Shown in the top bar; default the PDF's own title. |
| `theme` | `'light'` · `'dark'`. Without it: the reader's last choice (stored as `efv-theme`), else the system preference, followed live. |
| `lang` | `'en'` · `'sk'`. |
| `initialPage` | 1-based page to open at. |
| `initialFocus` | `IViewerFocus` `{ page?, paragraphId?, regionId?, bbox?, quads?, quadsPage? }`: opens at `page`, scrolls `bbox` into view, outlines it and flashes the sentence `quads`, then fades. |
| `keyboardShortcuts` | `'auto'` (default) · `'off'` (single keys off; Ctrl/Cmd and Esc stay). |
| `citationBib` | BibTeX of the publication: enables Cite and [reference-manager metadata](#reference-managers). |
| `citationMetadata` | Default `true`. `false` when the host publishes its own `citation_*` tags. |

### Services (each feature appears only with its function)

| Option | Signature |
| --- | --- |
| `homeFunction`, `closeFunction` | `() => void` |
| `shareFunction` | `(pages: string \| null, expiresAt: string) => Promise<string>`: a share link (`pages` like `"1,3-6"`, null for all) |
| `linkFunction` | `({ page, selection? }) => Promise<string>`: a link to a place, for people who already have access (grants nothing). Adds **Copy link** to the selection menu and **Link to this page** to the Share card. The host builds the URL, e.g. `/entries/<id>/read?page=N` or `?loc=<key>`; the selection text never goes into it. A rejection copies nothing. |
| `printFunction` | `(pages: string \| null) => Promise<string>`: URL of a printable PDF |
| `semanticSearchFunction` | `(query, { page }) => Promise<ISemanticSearchResult[]>`: "Related passages" above the text matches, and "Elsewhere in this book" in Explain |
| `explainFunction` | `(text, IExplainContext) => Promise<IExplainResult>`: see [Explain](#explain) |
| `suggestionsFunction` | `(kind, { selectedText?, page? }) => Promise<ISuggestedEntry[]>`: recommendations, "In other publications" in Explain |
| `openEntryDetailFunction` | `(entry) => void` |
| `bookmarkToggleFunction` | `(entry) => Promise<{ isOnShelf, shelfRecordId? }>` |
| `chatPackage` | `IChatPackage`: the reading chat, see [Chat](#chat) |
| `regionPackage` | `{ getRegionsFunc(page), getAllRegionsFunc?() }`: figure, table and equation cards |
| `agentAnnotationPackage` | `{ getAnnotationsFunc, requestAnnotationFunc?, waitForAnnotationFunc?, deleteHighlightFunc?, deleteAnnotationFunc? }`: AI highlights |
| `readerHighlightPackage` | `{ getHighlightsFunc, addHighlightFunc, deleteHighlightFunc? }`: the reader's own text highlights |
| `pageBookmarkPackage` | `{ getBookmarksFunc, addBookmarkFunc, removeBookmarkFunc }`: without it bookmarks last for the session |
| `editPackage` | `{ saveGroupFunc, getGroupsFunc, saveLayerFunc, updateLayerFunc, getLayerFunc, getLayersFunc? }`: drawing layers as SVG, see [Drawings](#drawings) |

### Loading

| Option | |
| --- | --- |
| `pdfAssetsUrl` | Where the host serves `pdfjs-dist`'s `wasm/`, `cmaps/`, `standard_fonts/`, `iccs/` (same version). Enables the Wasm JPX/JBIG2 decoders and correct CJK/standard-font glyphs. May be relative (`/pdfjs/`); the viewer resolves it against the page, because pdf.js fetches `wasm/` and `iccs/` inside its worker. |
| `pdfWorkerUrl` | `pdfjs-dist/legacy/build/pdf.worker.min.mjs` served by the host. Without it the bundled copy is loaded (a 1.7 MB `data:` chunk). |
| `workerRendering` | Draw pages in pdf.js' renderer worker (OffscreenCanvas), keeping the main thread free. |
| `telemetry` | `ITelemetrySink`: see [telemetry.md](telemetry.md). |

### Event callbacks

`onDocumentLoaded`, `onFirstPageRendered`, `onDocumentError`, `onLoadProgress`, `onStreamError`,
`onPageChange`, `onSearch`, `onSearchResultSelect`, `onSelectionChange`. Each is the matching
[event](#events), registered for you.

## The controller

`app.viewer` works at any time; before the document has loaded, navigation sets where it opens.

| Method | |
| --- | --- |
| `open(source, { initialPage?, initialFocus? }?)` | Swap the document without remounting. |
| `retry()` | Reload after a failure, or re-request ranges after a stream error. |
| `goToPage(n)` · `nextPage()` · `previousPage()` | Navigate (`goToPage` is a jump: it enters the history). |
| `goToLabel('iv')` · `goToDestination('chapter-3')` | Resolve to the physical page, or `null`. |
| `back()` · `forward()` | Walk the jump history. |
| `focus(IViewerFocus)` | Scroll to, outline and flash a paragraph or figure. |
| `getOutline()` | `IOutlineEntry[]` `{ title, page, level, children }`. |
| `openPanel(panel \| null)` | `'toc'` · `'pages'` · `'search'` · `'highlights'` (Navigator) · `'share'` · `'info'` · `'print'` (cards). |
| `search(query, { caseSensitive?, wholeWord?, ignoreDiacritics?, openPanel? })` | Resolves `{ query, source, total, pages, truncated }`. Also asks `semanticSearchFunction`. |
| `searchNext()` · `searchPrevious()` · `clearSearch()` | |
| `showResults(passages, { label?, select?, openPanel? })` | Show the host's own passages (e.g. a chat answer's sources), highlighted and steppable. |
| `setScale(n)` · `setTheme('dark' \| 'light' \| null)` · `setLang('en' \| 'sk')` | |
| `getState()` | `IViewerState`: frozen, and the same object until something changes. |
| `subscribe(listener)` | Called after every state change. Returns the unsubscribe function. |
| `on(event, listener)` | Listen to one [event](#events). Returns the unsubscribe function. |
| `setOptions(partial)` | Replace options without remounting; keys left out stay, `null` removes. |
| `getSelection()` · `clearSelection()` | The reader's selection (`ISelectionInfo`). |
| `getPageText(page)` | The page's text in reading order, cached. |

`getState()` returns `{ page, totalPages, pageLabel, canGoBack, canGoForward, scale, theme, lang, status,
progress, search: { query, source, total, active } }`.

## Events

`app.viewer.on(name, listener)`; the same payloads reach the `options.on*` callbacks. A throwing listener is
logged and never breaks the viewer or other listeners.

| Event | Payload |
| --- | --- |
| `document-open` | `{ source, streaming }` |
| `document-loaded` | `{ totalPages, source, streaming, totalBytes }` |
| `first-page-rendered` | `{ page, durationMs, source, streaming, bytesLoaded, totalBytes }` (once per document) |
| `document-error` | `{ stage, reason, status, source }` (at most once per document) |
| `load-progress` | `{ loaded, total }` (at most one per frame) |
| `stream-error` | `{ status }` |
| `page-change` | `{ page, totalPages, pageLabel, previousPage, cause, canGoBack, canGoForward }` |
| `scale-change` | `{ scale, fitToWidth }` |
| `theme-change` | `{ theme }` |
| `panel-change` | `{ panel }` (`null` when closed) |
| `search` | `{ query, source, total, pages, truncated }` |
| `search-select` | `{ source, index, page, id }` |
| `selection-change` | `ISelectionInfo \| null`: emitted when the reader lets go, not while dragging |
| `action` | `{ action }`: a top-bar or selection action ran |
| `annotation-change` | `{ page, action, kinds, count, input? }`: the reader drew, changed, removed, undid or redid marks on a page (no content) |

`page-change.cause` is `initial`, `step`, `input`, `thumbnail`, `link`, `outline`, `search`, `citation`,
`history`, `host` or `scroll`. Jumps (`link`, `outline`, `search`, `citation`, `host`) enter the history, so
a host can push browser history only for them and replace it for the rest.

## Drawings

The reader's marks (draw mode, key E) are objects, stored per page through `editPackage` as one SVG
string, the same contract as before. See [annotations.md](annotations.md) for the tools and the design.

- **Loading**: `getGroupsFunc()` once, then `getLayersFunc(groupId)` if given (one request), else
  `getLayerFunc(page, groupId)` per page as pages come into view. A group is created with
  `saveGroupFunc('edit-group')` only when the first drawing is saved.
- **Saving**: `saveLayerFunc` for a page's first layer, `updateLayerFunc` after. A page is saved once
  the reader pauses (1.5 s), and at once when they leave draw mode, hide the tab or open another
  document. At most one request per page is in flight; the latest state wins. A failed save is
  retried once after 10 s and on the next change.
- **Format**: `<svg width=W height=H viewBox="0 0 W H" data-efv-ink="2">` in the page's own units
  (PDF points of the page at scale 1), one top-level element per object. Each element is plain SVG
  (any renderer shows it) with `data-efv-id`, `data-efv-kind` (`pen`, `highlighter`, `rect`,
  `ellipse`, `line`, `arrow`, `mark`, `note`), `data-efv-note` (the reader's note),
  `data-efv-text` (the page text under the mark, ≤ 500 characters) and `data-efv-created` (epoch
  ms). Pen and highlighter strokes add `data-efv-points` (`x,y,pressure …`).
  A search index or an AI feature on the host can read the marks from there, without the PDF.
- **Older layers** (bare `path`, `line`, `rect` in pixels of the page as drawn) load as objects in their
  own space and are rewritten in the new format on their next change. A layer whose SVG cannot be
  parsed is left as stored: the page refuses edits rather than save over it.

## AI features

The viewer is the reading surface; the intelligence is the host's. Three kinds of contract connect them.

**Context out.** What the reader is looking at, for grounding prompts: `getSelection()` and the
`selection-change` event (text, page, line boxes), `getPageText(page)`, `getState().page`.

**Commands in.** Point the reader at things: `focus()` (a cited sentence), `showResults()` (an answer's
sources), `search()`, AI highlights through `agentAnnotationPackage`.

**Streams in.** Answers arrive while they are generated: the chat's `IChatStreamHandlers` and Explain's
`onPartial`.

Coordinates are page fractions `{ x0, y0, x1, y1 }` (0–1, top-left origin), valid at any zoom. Page numbers
are the reader's (1-based, as shown); a host serving a cut or re-ordered copy converts them.

### Explain

```ts
explainFunction: async (text, { page, regionId, parent, signal, onPartial }) => {
  // `signal` aborts when the reader closes the card or moves on: pass it to fetch.
  // `onPartial` streams: call it with what has arrived so far; the card updates in place.
  // `parent` is set when the text was selected inside a previous explanation.
  const stream = await api.explain({ text, page, regionId, parent }, { signal });
  let simple = '';
  for await (const chunk of stream) onPartial?.({ simple: (simple += chunk) });
  return {
    simple,                 // required, markdown; [[page:12]] links into the book
    detailed,               // "In depth", markdown
    examples,               // [{ label, description }]
    terms,                  // [{ term, definition }]: each term can be explained in turn
    related,                // ISemanticSearchResult[]: "Elsewhere in this book"
    followUps,              // questions that open the chat, already asked
  };
},
```

Only `simple` is required. Without `related`, the viewer asks `semanticSearchFunction` with the passage; with
`suggestionsFunction` it lists other publications on the topic. Selected text stays marked on its page while
the card is open; the card sits beside the page, or below/above the passage, never over it, and follows it on
scroll until dragged.

### Chat

```ts
chatPackage: {
  sendMessageFunc: async (message, contexts, handlers, { page, chatId }) => {
    // handlers: onChunk, onMessage, onEntries, onPages?, onAnnotation?, onStatus?, onActivity?, onCitations?, onError
    return { chatId };
  },
  resetFunc, suggestions, getChatsFunc, getChatFunc, deleteChatFunc, entryId, openCitationFunc,
}
```

- `contexts` are what the reader attached: `selection`, `explain`, `region` or `highlight` (`IChatContext`).
  The open publication is always the subject and is not sent as a context.
- Answer markdown may cite `[[page:12]]` and `[[region:<id>]]`; evidence labels `[E3]` (passage) and `[F2]`
  (figure) become chips once `onCitations` resolves them (`IChatCitation`). A chip of the open publication
  jumps like `initialFocus`; another publication's goes to `openCitationFunc`.
- `onActivity` feeds the collapsible tool log; `onStatus` the one-line progress label.

### Regions and AI highlights

```ts
regionPackage: { getRegionsFunc: async (page) => [{ id, kind, page, bbox, caption, markdown, latex, imageUrl }] }
agentAnnotationPackage: {
  getAnnotationsFunc: async () => [{ id, title, prompt, summary, status, highlights: [{ id, seq, page, quads, text, note }] }],
}
```

Each highlight is one sentence in reading order (`seq`), one quad per text line. Without `imageUrl` a region
card crops the rendered page.

## Reference managers

With `citationBib`, the viewer describes the publication the way publisher sites do, in the formats Zotero
documents in [Exposing Your Metadata](https://www.zotero.org/support/dev/exposing_metadata), so the
**Zotero Connector** (and other importers reading the same tags, such as Mendeley's) can save it:

- Highwire `citation_*` `<meta>` tags in the document head (title, authors, date, journal / book / conference,
  volume, issue, pages, DOI, ISBN, ISSN, keywords, abstract), marked `data-efv-citation`, removed on unmount and
  replaced when the citation changes. If the host page already has a `citation_title`, the viewer adds none.
- A COinS span (OpenURL ContextObject) inside the viewer, for Zotero's COinS translator.
- A `ZoteroItemUpdated` event on `document`, so Zotero re-detects in a single-page app.

The Cite card also exports **CSL-JSON**, which Zotero and Mendeley import, next to BibTeX, BibLaTeX and RIS.
Set `citationMetadata: false` when the host publishes its own tags.

Search-engine indexing (Google Scholar) is a different matter: crawlers need the tags in server-rendered HTML
of a publicly reachable page, which a client-side viewer behind a login cannot provide. Hosts that want
indexing render the tags on the server.

Verified in a browser: the tags, the COinS span and the CSL-JSON export. Not yet verified with the Zotero
Connector extension itself.

## Performance and the bundle

What a reader downloads (gzip, ES build):

| | |
| --- | --- |
| `evilFlowersViewer.es.js` | ~300 kB, at open |
| `style.css` | ~147 kB, at open (fonts inlined: one variable Inter per subset) |
| pdf.js worker | ~600 kB as the bundled `data:` chunk at open; with `pdfWorkerUrl` the host's own file instead (~390 kB gzip, cacheable across versions of the host app) |
| citations | ~190 kB, when Cite first opens |
| QR code, print | ~13 kB, when first used |
| renderer worker | ~80 kB, only with `workerRendering` |

The UMD build cannot split and inlines everything (~1.1 MB gzip); prefer the ES build.

At runtime: one pdf.js worker per viewer, reused for every `open()`; only pages near the view are mounted and
their bitmaps freed when they leave; zoom re-rasters off screen (no blank flash); search lists update at most
~16 times a second while pages stream in.

## Security and CSP

The viewer renders no PDF forms or AnnotationLayer and keeps XFA off, so PDF JavaScript never runs. Recommended
policy:

- `script-src` without `'unsafe-eval'` (pdf.js 6 needs no eval);
- `worker-src 'self' blob: data:` with the bundled worker, or just `'self'` (plus the worker's origin) with
  `pdfWorkerUrl`;
- `connect-src` for the PDF origin and `pdfAssetsUrl`;
- `style-src 'self' 'unsafe-inline'` when the host injects `style.css` as a string.
