# Changelog

## 0.7.0 : 2026-07-18

Core dependency modernization. All features re-validated end-to-end (render, text layer, keyword + semantic search, editing/canvas, citation, thumbnails, navigation, theming) — no functional regressions.

- **Changed**: **pdfjs-dist 4.8 → 6.1**. Adopted the v6-recommended `render({ canvas })` API (the legacy `canvasContext` path is gone from our code). Requires **Node ≥ 22.13** (declared in `engines`).
- **Changed**: **Vite 5 → 8** (Rolldown bundler — build ~7× faster), **@vitejs/plugin-vue 5 → 6**, **vite-plugin-dts 4 → 5** (now needs `@vue/language-core`; dts points at `tsconfig.app.json`), **vite-plugin-svgr 4 → 5**, **vite-plugin-vue-devtools 7 → 8**.
- **Changed**: **Pinia 2 → 4** (added the `@vue/devtools-api` peer), **vue-tsc 2 → 3**, **TypeScript 5.6 → 6.0**, **Vue 3.5.40**, **vue-i18n 11.4.6**, **DOMPurify 3.4**, plus dev-tooling patches.
- **Fixed**: The full-text `SearchWorker` is now a proper ES **module worker** (`{ type: 'module' }` + `worker.format: 'es'`) — under Vite 8 the classic worker silently truncated results; keyword search now returns the complete match set.
- **Fixed**: Pinned the lib CSS output back to `dist/style.css` (Vite 6+ renamed it from the package name).
- **Removed**: `@fortawesome/fontawesome-svg-core` and `@fortawesome/vue-fontawesome` — dead dependencies (never imported).
- **Deferred (deliberate)**: **Tailwind stays on 3.4** — v4 imposes a hard Chrome 111+/Safari 16.4+ floor on every consumer with no opt-out, an unacceptable reach regression for a distributed library. **TypeScript stays on 6.0** — TS 7's native compiler has no vue-tsc/Volar API yet and immature `.d.ts` emit. **citation-js stays on 0.7** — 0.8 calls Node's `util.promisify` and breaks in the browser.

## 0.6.0 : 2026-07-18

Deep maintenance, refactor and Figma alignment of the core viewer.

- **Added**: Optional semantic / AI search via `options.semanticSearchFunction`; when provided the search panel shows a two-column keyword + AI results layout (matches the Figma design), otherwise it stays keyword-only.
- **Added**: The default export now returns the Vue `App` instance so hosts can `unmount()` on teardown.
- **Changed**: **Style isolation** — all styles are now scoped under a `.efv-viewer` root class and Tailwind's global preflight is disabled, so the library no longer restyles the host app's `*`, `body`, buttons, inputs or scrollbars. Consumers can drop any manual CSS wrapping/`!important` workarounds.
- **Changed**: Inter is now self-hosted (latin + latin-ext subsets) instead of loaded from Google Fonts — CSP-safe and works offline.
- **Changed**: `options.theme` is now honoured (was previously ignored); default theme is light, aligned with Figma.
- **Changed**: Split the library entry (`main.ts`) from the dev harness (`dev.ts`) so sample PDFs and the demo app no longer ship in the published bundle.
- **Changed**: vue-i18n moved to Composition API mode (legacy mode was deprecated).
- **Fixed**: The PDF was parsed twice on load (once for the page view, once for thumbnails); it is now parsed once and shared, halving load work and memory.
- **Fixed**: Removed `markRaw`/reactivity console warnings and a stray `print` store export.

## 1.0.0 : 2024-12-30

- **Changed**: Design of whole viewer
- **Changed**: Language from React to Vue
- **Added**: Edit
- **Added**: Print
- **Added**: Fullscreen

## 0.5.15 : 2024-10-29

- **Fixed**: One step back button

## 0.5.14 : 2024-10-29

- **Added**: One step back button

## 0.5.13 : 2024-10-06

- **Fixed**: Umami tracker

## 0.5.12 : 2024-09-28

- **Fixed**: Bug

## 0.5.11 : 2024-09-28

- **Fixed**: Error with library

## 0.5.10 : 2024-09-28

- **Added**: umami trackers
- **Removed**: useCustomEffect

## 0.5.9 : 2024-09-08

- **Fixed**: `customUseEffect` returning function
- **Added**: `Print` option
- **Added**: `Config` for edit, share, download and print
- **Changed**: Edit was hidden

## 0.5.8 : 2024-08-13

- **Fixed**: translation

## 0.5.7 : 2024-08-13

- **Changed**: `groups` to `layers`
- **Changed**: groups and edit, merged together
- **Changed**: groups modal to sidebar
- **Changed**: `LayerItem` design
- **Changed**: edit menu

## 0.5.6 : 2024-07-18

- **Added**: Few comments to code
- **Changed**: Layers icon
- **Changed**: Last position in help
- **Removed**: try-catch used uselesly

## 0.5.5 : 2024-07-18

- **Added**: Removing border from svg before saving/editing
- **Added**: Layer in reading mode
- **Added**: Button to side bar for choosing groups
- **Added**: Help for new button in sidebar
- **Changed**: Saving layer function
- **Changed**: SVG in saving layer function from HTMLElement to string
- **Fixed**: talwind in loader and helper

## 0.5.4 : 2024-07-17

- **Changed**: After added group the input hides
- **Changed**: Modal design for goups in edit
- **Changed**: Close login in modal for groups
- **Changed**: Edit layer function
- **Fixed**: Button not pressed when hitting space in input in edit groups

## 0.5.3 : 2024-07-16

- **Changed**: worker src for prod

## 0.5.2 : 2024-07-16

- **Changed**: worker src for prod

## 0.5.1 : 2024-07-16

- **Added**: prefix to tailwind
- **Added**: Responsivness to edit
- **Added**: Resize when getting layer to adjust given elements
- **Changed**: edit `save layer` functions
- **Removed**: elements useState
- **Fixed**: stroke width responsivness

## 0.5.0 : 2024-07-16

- **Added**: Edit mode
- **Added**: New params to viewer
- **Added**: Bottom bar hidding possibility
- **Changed**: css to tailwindcss
- **Updated**: `pdfjs-dist` library

## 0.4.25 : 2024-05-13

- **Fixed**: Error `Cannot read properties of null (reading 'getBoundingClientRect')`

## 0.4.24 : 2024-05-13

- **Fixed**: Error with export

## 0.4.23 : 2024-05-13

- **Fixed**: Datatypes from string to TypedArray

## 0.4.22 : 2024-05-13

- **Removed**: binary function
- **Fixed**: Replacing child of null

## 0.4.21 : 2024-04-23

- **Removed**: Zotero

## 0.4.20 : 2024-04-23

- **Changed**: Zotero props

## 0.4.19 : 2024-04-23

- **Added**: Zotero

## 0.4.18 : 2023-11-04

- **Removed**: circle in help
- **Changed**: menu design
- **Changed**: help design
- **Changed**: few litlle design things

## 0.4.17 : 2023-11-04

- **Fixed**: width and height of the circle in help steps

## 0.4.16 : 2023-11-04

- **Fixed**: help steps positioning

## 0.4.15 : 2023-11-04

- **Fixed**: pdfjs gloabl worker

## 0.4.14 : 2023-10-25

- **Added**: debounc in every scroll handle
- **Added**: new translation senteces
- **Fixed**: Scroll view (just little)
- **Fixed**: bug in preview with changing pdf viewing
- **Changed**: pdf rendering code
- **Changed**: helper design and whole functioning
- **Changed**: code, little cleaner
- **Changed**: little design
- **Changed**: project architecture
- **Removed**: scroll view
- **Removed**: lot of unused variables

## 0.4.13 : 2023-10-24

- **Fixed**: citation page style
- **Fixed**: translation in citation
- **Changed**: translation in citation search

## 0.4.12 : 2023-10-13

- **Changed**: viewer working with variables
- **Changed**: scroll viewing changed when height is small
- **Changed**: introduction
- **Added**: bind for citation
- **Added**: bind for toc
- **Added**: bind for share
- **Added**: bind for search
- **Added**: bind for pen
- **Added**: bind for info
- **Added**: touchepad zooming

## 0.4.11 : 2023-10-09

- **Changed**: little design for sidebar
- **Fixed**: preview bug, with scrolling
- **Fixed**: scroll page bug, text was off
- **Removed**: previewHover

## 0.4.10 : 2023-10-08

- **Changed**: viewer design (colors)
- **Fixed**: few little things
- **Fixed**: search input for safari
- **Fixed**: performance for preview bar
- **Fixed**: performance for scroll page

## 0.4.9 : 2023-10-06

- **Added**: auto scroll to active page in preview
- **Fixed**: better printing in scroll view
- **Fixed**: better printing in preview
- **Changed**: design
- **Changed**: scale only to 1 in scroll view
- **Changed**: few more things...

## 0.4.8 : 2023-10-05

- **Fixed**: preview in bottom bar printing
- **Fixed**: searching in scroll
- **Changed**: few little things

## 0.4.7 : 2023-10-03

- **Fixed**: bug in bottom bar

## 0.4.6 : 2023-10-03

- **Fixed**: hover on preview pages in bottom bar
- **Fixed**: printing in bottom bar

## 0.4.5 : 2023-10-02

- **Fixed**: input flex in bottom bar
- **Fixed**: setting bottom bar based on choosen item in search
- **Changed**: few little things

## 0.4.4 : 2023-10-02

- **Added**: Hover in preview bar, so it will show hovered page
- **Changed**: whole design, again
- **Changed**: name outline to TOC
- **Fixed**: scroll view, better handling
- **Fixed**: bugs and design bugs
- **Fixed**: Toc navigation in document

## 0.4.3 : 2023-09-28

- **Changed**: Scroll pages viewing
- **Changed**: Image in introduction width change

## 0.4.2 : 2023-09-28

- **Changed**: preview bar
- **Changed**: preview bar design

## 0.4.1 : 2023-09-28

- **Added**: new introdaction images
- **Changed**: button in introduction/helper
- **Fixed**: centering helper image

## 0.4.0 : 2023-09-28

- **Added**: Scroll view
- **Changed**: little design

## 0.3.9 : 2023-09-23

- **Changed**: Menu compnent -> SideMenu
- **Changed**: padding in modal
- **Fixed**: search pattern highlighting

## 0.3.8 : 2023-09-22

- **Changed**: Modal padding
- **Changed**: pdf viewing button poisition
- **Changed**: pdf viewing visibility for mobile/tablets
- **Changed**: .header- style names to .menu- in menu.css

## 0.3.7 : 2023-09-22

- **Added**: css files
- **Added**: introduction
- **Added**: new senteces in translation
- **Changed**: Whole design
- **Changed**: styling compoments
- **Changed**: project architecture
- **Changed**: bottomBar -> PreviewBar
- **Changed**: header -> menu
- **Fixed**: PDF sizing
- **Fixed**: Errors and bugs

## 0.3.6 : 2023-09-15

- **Updated**: README.md
- **Added**: Header
- **Added**: Menu button in header
- **Added**: Home function posibility
- **Added**: Few lines in translation
- **Changed**: Position of scale buttons
- **Changed**: Position of paginator
- **Changed**: Tools visibility with menu button
- **Changed**: Design in paginator
- **Changed**: Tooltip positioning
- **Changed**: TOC put in tools, showed by modal
- **Changed**: Overall little design
- **Removed**: ZoomControls component
- **Fixed**: TOC links for pdf
- **Fixed**: Errors in TOC

## 0.3.5 : 2023-09-11

- **Updated**: README.md
- **Changed**: Design in info
- **Changed**: Design in search
- **Changed**: Design in share
- **Added**: Section in search, when search input is empty
- **Fixed**: Errors in outline.tsx and document.tsx
- **Fixed**: Citation

## 0.3.4 : 2023-09-11

- **Changed**: Position tolltip of share info button
- **Changed**: change-log.md -> CHANGELOG.md
- **Fixed**: Rendering viewer, renderViewer function (re-creating root)
- **Moved**: CHANGELOG.md out of src folder

## 0.3.3 : 2023-09-09

- **Added**: Senteces for translating
- **Changed**: Citation component
- **Changed**: Share component
- **Changed**: Design -> colors
- **Changed**: Language translator
- **Changed**: Positions of components such as paginator or zoom component
