# Accessibility

The viewer targets **WCAG 2.2 AA** and follows the **WAI-ARIA Authoring Practices** for its widgets. What that
means in practice, and where the limits are.

## Keyboard

- Every control is reachable with <kbd>Tab</kbd> and has a visible `:focus-visible` ring (system
  `Highlight` in forced-colors mode).
- **Shortcuts** (README › Keyboard) are single keys active only while focus is in the viewer, or on the page
  body when it was the viewer used last (WCAG 2.1.4 Character Key Shortcuts). They never fire while typing in
  any field, the host's included. Hosts with their own shortcuts set `keyboardShortcuts: 'off'`; Ctrl/Cmd
  combinations and <kbd>Esc</kbd> stay. Top-bar buttons announce theirs via `aria-keyshortcuts` and show
  name and shortcut in a tooltip on hover and on keyboard focus.
- <kbd>Esc</kbd> closes the top-most layer only (card, popup, panel, in the order they opened), then leaves the
  drawing tool. It never navigates or closes the viewer.
- The **selection menu** is a toolbar: <kbd>←</kbd>/<kbd>→</kbd> move between its actions (roving tab index).
- The **Explain card** is a non-modal dialog: focus moves into it when it opens, <kbd>Esc</kbd> closes it.
- Drawing tool size is a native range input (arrows, Home/End, PageUp/PageDown).

## Screen readers

- One polite live region per viewer announces what the eye sees but assistive technology would miss: the page
  after navigation (debounced while scrolling, so the page the reader settles on is spoken, not every page
  passed), search result counts, "Copied", "Explanation ready".
- The page bitmap is `aria-hidden`; the pdf.js text layer carries the readable text, in reading order, and each
  page is a labelled group ("p. 12", using the PDF's own page labels).
- Icon-only buttons have localized accessible names; toggles expose `aria-pressed` / `aria-expanded`; the
  Explain card is `role="dialog"` with `aria-labelledby` and `aria-busy` while loading, with headings per
  section and real lists.
- The viewer root carries `lang` (`options.lang`), so speech uses the right pronunciation.

## Visual

- **Forced colors** (Windows High Contrast): focus rings, highlights, the explained passage and the selection
  menu switch to system colors (`Highlight`, `Mark`, `CanvasText`) with real outlines, since shadows and
  translucent fills disappear there.
- **Reduced motion**: every animation and transition is reduced to an instant under
  `prefers-reduced-motion: reduce`.
- **Dark theme** follows the system until the reader or host chooses.
- Body text in the Explain card is 13–13.5 px; top-bar and selection-menu targets are 30–32 px (above the
  WCAG 2.5.8 minimum of 24 px).
- On phones, secondary selection actions become icons with tooltips and keep their names for screen readers.

## Known limits

- PDF **structure** (tagged PDFs: headings, lists, alt text) is not exposed yet; the text layer is a flat run
  of spans. pdf.js' `getStructTree()` could map it to ARIA roles: a candidate next step.
- Scanned PDFs without a text layer have nothing to read aloud; OCR has to happen on the catalog side.
- Drawings are pointer-only.
- The Escape layer stack is shared by every viewer on the page.

## Checking

- Browser: keyboard-only pass, then a screen reader (VoiceOver: <kbd>VO</kbd>+<kbd>U</kbd> landmarks/headings;
  NVDA: browse mode), then forced colors (Chrome DevTools › Rendering › Emulate forced-colors).
- Automated: Playwright's accessibility snapshot of the dialog and toolbar (see docs/development.md).
