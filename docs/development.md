# Development

## Setup

Node ≥ 22.13.

```bash
npm install
npm run dev            # dev harness on http://localhost:3000 (add -- --port 5173 to move it)
npm run type-check     # vue-tsc over src/
npm test               # vitest: src/core unit tests
npm run build          # type-check + library build into dist/
```

## The dev harness

`index.html` → `src/dev.ts` → `src/App.vue` mounts the viewer with every host feature wired to mocks in
`src/assets/examples/params/examples.ts` (chat, explain with streaming, regions, AI highlights, bookmarks,
drawing layers) and logs events and telemetry to the console. In the browser console:

```js
viewer()                       // the controller: viewer().goToPage(16), viewer().getState()
efvTelemetry                   // every telemetry event exported so far
```

URL switches: `?source=url` (load by URL), `?url=<pdf>`, `?chunk=16384`, `?streaming=1`,
`?token=<url>` (function headers with refresh), `?worker=1` (renderer worker), `?focus=N` (open at a cited
paragraph on page N).

## Tests

- **Unit** (`npm test`): everything in `src/core` is framework-free and has `*.test.ts` next to it. New core
  logic comes with tests.
- **Browser**: UI changes are validated in a real browser, e.g. with Playwright against the dev server:
  - render, scroll, zoom (buttons, Ctrl/Cmd ±, pinch), Navigator;
  - text selection: drag across lines and into the margin; the selection must not jump, the menu appears on
    release only, `viewer().getSelection().text` reads cleanly;
  - Explain: streaming, sections, nested term, Back, Esc; the card must not cover the passage;
  - controller: `getState()` identity, `subscribe`, `on`, `setOptions`;
  - accessibility snapshot of the toolbar and dialog; dark theme; 390 px width.
- **Built bundle**: lazy chunks only exist in `dist/`. Mount `dist/evilFlowersViewer.es.js` on a bare page
  with an import map for `vue` → `node_modules/vue/dist/vue.esm-browser.prod.js`, served by a **plain static
  server** (`python3 -m http.server`), and check the network: only the entry and the worker load at open;
  `chunks/formatter-*` only when Cite opens. Don't serve `dist/` through the Vite dev server: it rewrites the
  bundle's `vue` import to its development build, and the mix of production-compiled components with the
  dev runtime misbehaves in ways a real host never sees.

## Bundle budget

Measured on the ES build (gzip): entry ≤ 310 kB (301 kB at 2026-11-18), `style.css` ≤ 150 kB (147 kB). Check after `npm run build` (Vite prints
the sizes). Heavy, rarely used dependencies are `import()`ed where first needed; never import citation-js,
print-js or qrcode from code that runs at open.

## Dependencies

`npm outdated` and `npm audit --omit=dev` before a release. Deliberately pinned (see docs/architecture.md ›
Decisions): Tailwind 3, TypeScript 6, citation-js 0.7. Dev-only audit findings come from `picomatch` (no
patched release exists) and don't reach the package.

## Releasing

1. Update `CHANGELOG.md` (move *Unreleased* under the new version) and bump `version` in `package.json`.
2. Tag and push: `git tag vX.Y.Z && git push origin vX.Y.Z`.
3. The Publish workflow checks the tag matches `package.json`, installs, type-checks, runs the tests and
   publishes to npm. Consumers install the tag from git or npm.
