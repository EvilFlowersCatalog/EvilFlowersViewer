# Annotations: drawings, notes, pen and touch

Issue #156. Diagrams: [component-annotation-layer](diagrams/component-annotation-layer.puml),
[state-ink-input](diagrams/state-ink-input.puml). Host contract: [host-integration.md#drawings](host-integration.md#drawings).

The goal is to bring the content closer to the reader. Marks are part of reading: you circle,
underline, write in the margin and come back to them. They are not a separate editing app laid over
the book.

## What there is

| Tool (key in draw mode) | What it does |
| --- | --- |
| Select (1) | Tap a mark to select it, Shift+tap to add more, or drag on empty paper for a marquee. Drag to move; corner handles resize (strokes keep their proportions, Shift keeps them for shapes). |
| Pen (2) | Ink shaped by pen pressure. A mouse or finger gets its width from speed instead, like a fountain pen. |
| Highlighter (3) | Translucent and blended with `multiply`, so the text stays crisp under it. |
| Shapes (4) | Rectangle, ellipse, line, arrow (pick in the swatch popover). Shift draws a square or circle, or snaps lines to 45°. |
| Note (5) | A sticky note pinned to the page. Typing starts at once. While reading, click the pin to read the note beside it. |
| Eraser (6) | Removes whole marks it touches (object eraser). The pen's eraser end does the same with any tool in hand. |

- **Hold to snap.** Hold the pen still at the end of a stroke (0.6 s) and the stroke becomes a line, rectangle or ellipse. A held highlighter straightens.
- **Inspector at the selection.** It holds colour, width (−/+), the note, bring to front, duplicate (⌘D) and delete (⌫). It also shows the text the mark sits on.
- **Keyboard.** ⌘Z / ⇧⌘Z (also ⌘Y) undo and redo across pages; when the change is on another page, undo jumps there. Arrows nudge (Shift ×10), ⌘A selects all marks on the page, Esc steps back: selection, then draw mode.
- **Each tool remembers its own colour and width**, so a yellow highlighter stays yellow after you pick up a black pen.
- **Autosave is quiet.** It waits for a pause, saves at once on leaving draw mode or hiding the tab, and shows a small check at the foot of the rail. It only asks for attention when a save failed.

### Pen and touch

All input is Pointer Events (`pointerType` pen / mouse / touch), with `setPointerCapture`.
`getCoalescedEvents()` supplies every pen sample the browser merged into one `pointermove` (a pen
reports far more often than the screen refreshes; one source gives 240 Hz for Apple Pencil). It
falls back to the event itself when the list is empty (synthetic events, an old Firefox bug).

- **Palm rejection, the note-taking-app way.** Until a pen is seen, one finger draws and two fingers
  pinch (a second finger cancels the stroke). Once a pen touches the page, fingers scroll and zoom
  (`touch-action: pan-x pan-y`) and only the pen draws. A hand toggle appears on the rail to let
  fingers draw again.
- **Pen eraser.** The eraser end (or barrel button: `button === 5` / `buttons & 32`) erases
  whatever tool is in hand.
- **Pressure** (0–1) is stored per point, so a stroke re-renders the same everywhere. Stroke
  outlines come from [perfect-freehand](https://github.com/steveruizok/perfect-freehand) (MIT). It
  lives in the lazy ink chunk (9 kB gzip with the layer UI), not in the entry.

**Not tested on real hardware yet.** This was tested in Chromium with emulated pen and touch (CDP
`Input.dispatchMouseEvent` with `pointerType: 'pen'`, `Input.dispatchTouchEvent`). It still needs
an iPad with Apple Pencil (Safari) and a Windows pen (Surface or Wacom; Windows Ink has its own
gestures).

## Design decisions

- **One layer per page, not one canvas for the active page.** Each mounted page draws and edits on its own layer. The reader writes on whichever page is under the pen, and scrolling never moves the canvas away.
- **Objects, stored as SVG.** The host contract and the stored format stay SVG: plain elements any renderer shows, plus `data-efv-*` attributes that make them objects again. Older layers load as objects. New pen paths use only `M`/`L` tokens, because older viewers rescale paths by parsing exactly those.
- **Coordinates in the page's own space** (`viewBox`), never rewritten on zoom; the old `resizeElements` pass is gone.
- **Every gesture is one undo step and one save.** It previews locally and commits once, on pointer up.
- **Marks know what they are about.** On creation and move, each mark records the text under it (`data-efv-text`). Lists, search and AI can use that without the PDF.
- **Draw mode stays a mode.** Reading is the default and E toggles drawing. Notes are readable, and editable, from reading mode.

## Research: what comparable tools do

The Zotero rows and the Pointer Events notes are sourced below. The other rows describe how those apps
behave from general product knowledge (2026), not from a sourced review; check before quoting them.

| Tool | What is worth taking | Taken |
| --- | --- | --- |
| Apple Markup / Notes | A tool palette with per-tool colour and width; hold-to-snap shapes; Pencil draws and fingers scroll ("Only Draw with Apple Pencil"); the eraser end of the Pencil; lasso to move | ✓ all except lasso |
| GoodNotes / Notability | Lasso select and move or resize; shape recognition; palm rejection; ink that follows pressure; a highlighter that straightens | ✓ marquee, not lasso |
| PDF Expert / Acrobat | Sticky notes with comments; an annotation list; inspector of colour, width and opacity; text-anchored highlights | ✓ notes and inspector; the list is in the backlog |
| Zotero 7 reader (pdf.js-based, open source) | Ink, text and image annotations on PDFs, each with a comment, listed in a sidebar and exportable to notes. Its forum reports eraser bugs that crossed pages and ink conflicts with Windows Ink | ✓ comment on every mark. Per-page layers avoid cross-page erasing |
| Hypothesis | Annotations anchored to text quotes (they survive re-rendering) and shared in groups | anchor text recorded; groups in the backlog |
| LiquidText / MarginNote | Pull excerpts out into a workspace, link passages, many-to-many notes across documents | backlog ("excerpts") |
| tldraw / Excalidraw | Selection handles, keyboard nudge, duplicate, z-order | ✓ |
| pdf.js editor | Built-in ink, free text, highlight and stamp editors that write real PDF annotations | not used: the portal stores layers, not PDFs |

Sources:
- Zotero 7: [blog](https://www.zotero.org/blog/zotero-7/), [beta reader thread](https://forums.zotero.org/discussion/106716/available-for-beta-testing-updated-reader-with-epub-snapshot-support-and-new-annotation-types), [ink bug](https://forums.zotero.org/discussion/112405/inking-bug-in-zotero-7-parts-of-inking-notes-disappear)
- Pointer Events: [W3C Pointer Events](https://www.w3.org/TR/pointerevents/); [getCoalescedEvents for ink](https://nutrient.io/blog/using-getcoalescedevents); [Apple Pencil pressure in the browser](https://dev.to/sendotltd/reading-apple-pencil-pressure-in-the-browser-pointerevent-getcoalescedevents-and-the-2e23)
- Delegated ink trail: [Web Ink Enhancement explainer](https://github.com/dontcallmedom/ink-enhancement) (archived)
- Reading apps: [LiquidText vs MarginNote](https://paperlike.com/blogs/paperlikers-insights/liquidtext-vs-marginnote)

## Backlog

Ordered by value to the reader against effort.

1. **Marks in the Navigator.** List every mark with its note and its `text` next to "My highlights", grouped by chapter, and click to jump. `getLayersFunc` already loads all pages at once.
2. **Lasso selection** (freeform). The marquee covers most cases; a lasso matters on dense pages.
3. **Highlighter snaps to text lines.** A stroke over text becomes a `mark` on the text-layer boxes under it, like a selection highlight but drawn.
4. **Text boxes** typed onto the page (free text), with font size and colour.
5. **Pen draws in reading mode** (iPad Markup style): a pen touching the page starts ink with the last pen tool, without entering draw mode. Needs a preference, because on Windows a pen also selects text.
6. **Partial (pixel) eraser** that splits strokes. Today the eraser removes whole objects, as GoodNotes does by default.
7. **Delegated ink trail** (`navigator.ink`) for lower latency in Chromium on Windows pens. The proposal is archived, so watch for a successor.
8. **Opacity and dash** in the inspector; arrowheads on both ends; filled shapes.
9. **Export.** Flatten marks into the downloaded or printed PDF (pdf-lib), or export notes to Markdown or Zotero.
10. **Shared and group annotations** (class or reading group, Hypothesis-style). This needs portal work: an author per object, visibility, and moderation.
11. **Excerpts.** Drag a selected passage or figure into a side "workspace" with your notes and links back (LiquidText).

### AI, when the hardware or an indexed catalog allows it

The marks are AI-ready already. Each one carries its page, its box, its kind, the reader's note and
the text under it. The host receives `annotation-change` and stores everything in the layer SVG, so
none of the ideas below needs new viewer data. With live LLM latency or embeddings over the
catalog:

- **Ask about my marks.** "What did I mark in chapter 3?" or "turn my highlights into a summary or flashcards": the chat with `IChatContext` built from the marks' text and notes.
- **Explain a scribble.** Circle a formula or figure with the pen, and the Explain card opens for what the circle encloses (text under the box, or the region of `regionPackage`). This is the pen-native version of select → Explain.
- **Handwriting to text.** Recognise handwritten notes (on-device or server), make them searchable and copyable, and keep the ink.
- **Smart shapes.** An arrow from a mark to a passage becomes a link; brackets in the margin become a highlight of the paragraph.
- **Related marks across the library.** Embed `text` and `note` per mark; on opening a book, "you marked something similar in X" as an "Elsewhere" section.
- **Margin suggestions.** Where many readers (anonymised, aggregated) or the agent mark a passage, offer it as a faint hint the reader can accept. This is the agent-highlight layer, made personal.
- **Study mode.** Spaced repetition from notes and highlights, with each card linking back to its page through `linkFunction` (#155).

Each needs only the host: `editPackage` data, `annotation-change`, and `getPageText`, `getSelection`
and `linkFunction`, which already exist.
