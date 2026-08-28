<div align="center">
  <h1>EvilFlowersViewer</h1>
  <p><strong>A focused, extensible PDF workspace for the browser</strong></p>
  <p>
    Read, search, annotate, cite and share documents without leaving the page.
  </p>
  <p>
    <a href="https://github.com/EvilFlowersCatalog/EvilFlowersViewer/releases">
      <img src="https://img.shields.io/github/v/release/EvilFlowersCatalog/EvilFlowersViewer?style=for-the-badge&label=release" alt="Latest release">
    </a>
    <a href="https://www.npmjs.com/package/@evilflowers/evilflowersviewer">
      <img src="https://img.shields.io/npm/v/@evilflowers/evilflowersviewer?style=for-the-badge&label=npm" alt="npm package">
    </a>
    <a href="https://github.com/EvilFlowersCatalog/EvilFlowersViewer/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/EvilFlowersCatalog/EvilFlowersViewer?style=for-the-badge" alt="License">
    </a>
  </p>
  <a href=".github/assets/viewer-preview.jpg">
    <img src=".github/assets/viewer-preview.jpg" alt="EvilFlowersViewer displaying a PDF with annotations, search tools and page thumbnails" width="100%">
  </a>
</div>

EvilFlowersViewer is a PDF viewer based on the pdf.js library that lets users view and interact with PDF documents
directly in the browser. Developed by a university team, it is reliable, efficient and easy to customize.

## Features

- PDF document rendering directly in the browser
- Zoom in and out of documents
- Page navigation through a page thumbnail view
- Text search within documents
- Optional semantic / AI search shown alongside keyword results
- Share the entire document or with selected pages
- Citation export in BibTeX, BibLaTeX, RIS and bibliography
- Print the entire document or with selected pages
- Download document
- Light / dark themes (honours the host-provided theme, defaults to light)
- Fullscreen mode
- Editing document (freehand, shapes, highlighter, eraser, undo/redo)
- Keyboard-friendly and screen-reader accessible (see [Accessibility](#accessibility))

## Styling & isolation

All viewer styles are scoped under a single `.efv-viewer` root class and Tailwind's
global preflight is disabled, so **importing this library never restyles the host
application** (`*`, `body`, buttons, inputs and scrollbars are left untouched). The
Inter font is self-hosted (no external Google Fonts request). Consumers just import
the stylesheet — no manual scoping/wrapping required:

```ts
import '@evilflowers/evilflowersviewer/dist/style.css';
```

## Accessibility

The viewer is built to be usable with a keyboard and assistive technologies:

- **Keyboard**: all controls are reachable via <kbd>Tab</kbd>; page thumbnails, tools
  and color swatches respond to <kbd>Enter</kbd>/<kbd>Space</kbd>. Shortcuts:
  <kbd>←</kbd>/<kbd>→</kbd> page, <kbd>+</kbd>/<kbd>-</kbd> zoom, <kbd>F</kbd> search,
  <kbd>T</kbd> table of contents, <kbd>I</kbd> info, <kbd>S</kbd> share, <kbd>C</kbd>
  citation, <kbd>Esc</kbd> steps back out (modal → panel → tool → zoom → page → close).
- **Screen readers**: every icon-only button has an accessible name (localized), toggles
  expose `aria-pressed`/`aria-expanded`, the left rail is a `role="toolbar"`, dialogs are
  `role="dialog"` + `aria-modal` with focus trapping, and loaders announce via
  `role="status"`. The rasterized page canvas is `aria-hidden`; the selectable pdf.js text
  layer carries the readable content.
- **Focus & motion**: a visible `:focus-visible` ring is shown for keyboard users, and all
  animations respect `prefers-reduced-motion`.
- The viewer root carries a `lang` attribute matching `options.lang` so pronunciation is
  correct. All a11y CSS is scoped under `.efv-viewer` and never touches the host page.

## Features Under Development

## Getting started

**Requirements:** Node **≥ 22.13** (required by pdfjs-dist 6).

To get started with EvilFlowersViewer, follow these steps:

1. Install EvilFLowersViewerPackage:

```bash
npm install @evilflowers/evilflowersviewer
```

2. Import the default `renderPDFViewer` function and the stylesheet:

```ts
import renderPDFViewer from '@evilflowers/evilflowersviewer';
import '@evilflowers/evilflowersviewer/dist/style.css';
```

3. Call it with a single options object. It returns the Vue `App` instance so you
   can unmount it on teardown:

```ts
const app = renderPDFViewer({
  rootId: '#my-viewer',      // CSS selector of the mount element
  data: uint8ArrayOfPdf,      // TypedArray of the PDF bytes
  options: { theme: 'light', lang: 'en' /* … */ },
  config: { download: true, share: true, print: true, edit: false },
});

// later, e.g. on route change:
app.unmount();
```

# Viewer Options and Properties Documentation

| Input                         | Description                                                                         |
| -------------------------     | ----------------------------------------------------------------------------------- |
| rootId                        | ID of your component where you use the `renderViewer` function.                     |
| base64                        | String containing the Base64 format of the PDF.                                     |
| options                       | Optional object consisting of theme, language, citationBib, homeFunction, etc.      |
| options.theme                 | 'dark' or 'light'. Determines the viewer's theme.                                   |
| options.lang                  | 'sk' or 'en'. Specifies the language of the viewer.                                 |
| options.citationBib           | String or null. Contains the citation of the document (e.g., `@article{name, ...}`). |
| options.homeFunction          | Function (type: `() => void`) or null. Redirects to the home view.                  |
| options.closeFunction         | Function (type: `() => void`) or null. Closes the viewer.                           |
| options.shareFunction         | Function (type: `(pages: string | null, expaireDate: string) => Promise<string>`) or null. Generates a shareable link for the document. |
| shareFunction.pages           | String with selected pages (e.g., '1,3-6,10') or null (indicating no pages).        |
| shareFunction.expaireDate     | ISO string specifying the lifespan of the shared document.                          |
| shareFunction => return       | Returns a string containing the link to the shared document.                        |
| options.printFunction         | Function (type: `(pages: string | null) => Promise<string>`) or null. Generates a printable version of the selected pages. |
| options.semanticSearchFunction | Function (type: `(query: string) => Promise<ISemanticSearchResult[]>`) or null. Optional semantic/AI search. When supplied, the search panel shows a second column of AI results (`{ page, text, score? }`) next to the keyword matches; when omitted the panel stays keyword-only. |
| options.editPackage           | Optional object for managing edit features, containing the following functions:     |
| editPackage.saveGroupFunc     | Function (type: `(name: string) => Promise<{ response: { id: string } }>`). Saves a new group and returns its ID. |
| editPackage.getGroupsFunc     | Function (type: `() => Promise<{ id: string; name: string }[]>`). Retrieves all available groups. |
| editPackage.saveLayerFunc     | Function (type: `(svg: string, groupId: string, page: number) => Promise<ILayer | null>`). Saves a new layer to a group on a specific page. |
| editPackage.updateLayerFunc | Function (type: `(id: string, svg: string, groupId: string, page: number) => Promise<void>`). Updates an existing layer in a group on a specific page. |
| editPackage.getLayerFunc  | Function (type: `(page: number, groupId: string) => Promise<ILayer | null> | null`). Retrieves a layer from a group on a specific page. |
| config                    | Optional configuration object controlling viewer features.                          |
| config.download           | Boolean. Enables or disables the download feature.                                  |
| config.share              | Boolean. Enables or disables the share feature.                                     |
| config.print              | Boolean. Enables or disables the print feature.                                     |
| config.edit               | Boolean. Enables or disables the edit feature.                                      |



## Contributing

We welcome contributions from the community to help make EvilFlowersViewer even better. To contribute, please follow
these steps:

1. Fork the EvilFlowersViewer repository
2. Create a new branch for your changes
3. Make your changes and commit them with a clear commit message
4. Push your changes to your forked repository
5. Create a pull request to merge your changes into the main EvilFlowersViewer repository

## Acknowledgment

This open-source project is maintained by students and PhD candidates of the
[Faculty of Informatics and Information Technologies](https://www.fiit.stuba.sk/) at the Slovak University of
Technology. The software is utilized by the university, aligning with its educational and research activities. We
appreciate the faculty's support of our work and their contribution to the open-source community.

![](docs/images/fiit.png)
