<div align="center">
  <h1>EvilFlowersViewer</h1>
  <p><strong>A document-centric PDF reader for the browser</strong></p>
  <p>Read, search, explain, cite and share, inside any web application.</p>
  <p>
    <a href="https://github.com/EvilFlowersCatalog/EvilFlowersViewer/releases"><img src="https://img.shields.io/github/v/release/EvilFlowersCatalog/EvilFlowersViewer?style=for-the-badge&label=release" alt="Latest release"></a>
    <a href="https://www.npmjs.com/package/@evilflowers/evilflowersviewer"><img src="https://img.shields.io/npm/v/@evilflowers/evilflowersviewer?style=for-the-badge&label=npm" alt="npm package"></a>
  </p>
  <a href=".github/assets/viewer-preview.jpg">
    <img src=".github/assets/viewer-preview.jpg" alt="EvilFlowersViewer showing a book page with the top bar, Navigator and search" width="100%">
  </a>
</div>

EvilFlowersViewer is a Vue 3 + [pdf.js](https://mozilla.github.io/pdf.js/) reader that mounts into any page
(React, Vue, plain HTML). It is the reader of the [Elvira](https://github.com/EvilFlowersCatalog) digital
library, built by students and PhD candidates of the
[Faculty of Informatics and Information Technologies, STU](https://www.fiit.stuba.sk/).

The viewer never talks to a backend itself: everything beyond reading (explanations, chat, semantic search,
bookmarks, sharing) is a function the host passes in, and **a feature is hidden entirely when its function is
missing**.

## Features

- **Reading.** All pages in one continuous scroll, sharp on HiDPI screens, opening at the width of the view.
  Pinch or Ctrl/Cmd ± zoom around the fingers. Back/forward through jumps (links, contents, search hits,
  citations) with a "Back to p. N" chip. PDF page labels ("iv", "12") work in the page box.
- **Streaming.** With `url`, the first page paints from HTTP Range requests before the file has arrived;
  expiring tokens are refreshed mid-read, and a dropped connection offers Reconnect.
- **Navigator** (`T`): contents, page grid, search grouped by chapter, notes (bookmarks and highlights).
- **Text selection** that behaves: the selection doesn't jump over gaps between words, the menu appears when
  you let go (not while dragging), and copied text reads as prose (line breaks become spaces, words
  hyphenated across lines are joined).
- **Explain** (`explainFunction`): select text and get a plain explanation streamed into a card beside the
  page, with *In depth*, examples, key terms (explain those too), **where else this book covers it**, other
  publications on the topic and questions to ask the chat next.
- **Reading chat** (`chatPackage`) with citations into the book, AI highlights, figure/table/equation cards,
  recommendations.
- **Cite** (APA, Harvard, Vancouver, BibTeX, BibLaTeX, RIS, CSL-JSON), **Share** (scope, expiry, link,
  QR), **Print**, **Download**, drawing annotations.
- **Reference managers.** The Zotero Connector (and other tools that read Highwire `citation_*` tags or
  COinS, such as Mendeley's importer) can save the open publication, described from your BibTeX.
- **Accessible**: keyboard everything, screen-reader announcements, forced-colors support, reduced motion.
  See [docs/accessibility.md](docs/accessibility.md).
- **Built for hosts**: one controller, a typed event stream (React `useSyncExternalStore` ready), live
  option updates, telemetry with no document content, and AI context (selection, page text).
- **Light on the page**: about 300 kB gzip of JavaScript at open (entry bundle; the pdf.js worker comes on
  top), plus 147 kB of CSS. Citations, QR and printing load when first used. Styles are scoped and never
  touch the host page.

## Install

Requires Node ≥ 22.13 to build (pdf.js 6).

```bash
npm install "github:EvilFlowersCatalog/EvilFlowersViewer#v0.8.0"   # a release tag (or #semver:^0.8.0)
npm install "github:EvilFlowersCatalog/EvilFlowersViewer#develop"  # latest development
npm install @evilflowers/evilflowersviewer                          # npm (tagged versions)
```

Installed from git, the package builds its own `dist/` (the `prepare` script).

## Quick start

```ts
import renderViewer from '@evilflowers/evilflowersviewer';
import '@evilflowers/evilflowersviewer/dist/style.css';

const app = renderViewer({
  rootId: '#viewer',                 // a CSS selector or an element
  url: '/api/v1/entries/42/content', // or `data: Uint8Array`
  httpHeaders: ({ retry }) => auth.headers({ refresh: retry }),
  options: {
    lang: 'en',
    citationBib: '@book{…}',
    pdfAssetsUrl: '/pdfjs/',                         // wasm/, cmaps/, standard_fonts/, iccs/
    pdfWorkerUrl: '/pdfjs/pdf.worker.min.mjs',       // optional: serve the worker yourself
    explainFunction: (text, { page, signal, onPartial }) => api.explain(text, { page, signal, onPartial }),
    telemetry: faroSink(faro),                       // adapter in docs/telemetry.md
  },
  config: { download: true, share: true, print: true, edit: false },
});

app.viewer.goToPage(12);
app.viewer.on('page-change', ({ page, cause }) => history.replaceState(null, '', `?page=${page}`));

// later
app.unmount();
```

### React

The controller's `subscribe` and `getState` fit `useSyncExternalStore` directly: `getState` returns the same
frozen object until something changes.

```tsx
const viewer = app.viewer;
const state = useSyncExternalStore(viewer.subscribe, viewer.getState);
// state.page, state.totalPages, state.scale, state.status, state.search.total …

// Fresh closures on every render? Hand them over without remounting:
useEffect(() => viewer.setOptions({ explainFunction, chatPackage }), [explainFunction, chatPackage]);
```

## Documentation

| | |
| --- | --- |
| [Host integration](docs/host-integration.md) | Every option, the controller, events, streaming by URL, AI features, reference managers, CSP. |
| [Telemetry](docs/telemetry.md) | The sink interface, the event catalogue, Faro and OpenTelemetry adapters. |
| [Architecture](docs/architecture.md) | Layers, design patterns, data flow, where to change what. |
| [Accessibility](docs/accessibility.md) | Keyboard map, screen-reader behaviour, standards followed. |
| [Development](docs/development.md) | Dev harness, tests, browser validation, bundle budget, releasing. |
| [Changelog](CHANGELOG.md) | What changed, per release. |

## Keyboard

Single keys act while the viewer has focus (or nothing else does), never while typing in a field:
`←` `→` page · `Home` `End` first/last · `+` `-` zoom · `F` find · `T` Navigator · `C` cite · `S` share ·
`P` print · `D` download · `I` info · `R` recommendations · `E` draw · `A` ask · `Esc` closes the top-most
card, popup or panel, then leaves the drawing tool. With modifiers: Ctrl/Cmd+F find, Ctrl/Cmd+G or F3 next
match (Shift: previous), Ctrl/Cmd `+` `-` `0` zoom, Alt+`←` `→` back/forward. `keyboardShortcuts: 'off'`
turns the single keys off.

## Styling and isolation

All styles are scoped under `.efv-viewer`; Tailwind's preflight is off and replaced by a scoped reset, and every
utility is emitted as `.efv-viewer .x`, so the viewer neither restyles the host nor is restyled by it. Design
tokens (`--efv-primary`, `--efv-viewer-bg`, …) can be overridden on `.efv-viewer`. Inter is self-hosted as one
variable font per subset (Latin, Latin Extended); no external font request.

## Contributing

Work on a branch from `develop`, keep `npm run type-check`, `npm test` and `npm run build` green, validate UI
changes in a browser ([docs/development.md](docs/development.md)), and open a pull request against `develop`.
Releases are tags (`vX.Y.Z` matching `package.json`); the Publish workflow checks, tests and publishes them.
