// Text selection over the pdf.js text layers of one viewer. Framework-free.
//
// Two jobs:
// 1. The selection guard pdf.js' own viewer uses (TextLayerBuilder): while
//    the reader drags, an `.endOfContent` block is moved right after the span
//    under the selection's moving end. Without it, dragging over the empty
//    space between spans selects everything up to the end of the layer and
//    the selection jumps around ("glitchy").
// 2. One selection model per gesture, published when the reader lets go (or
//    stops extending it with the keyboard), never while dragging: no menu
//    popping in and out mid-drag ("refreshy").
import type { IPageBox, ISelectionInfo } from '@/assets/utils/interfaces';

export type SelectionState = { kind: 'none' } | { kind: 'selecting' } | { kind: 'selected'; selection: ISelectionInfo };

/** A selection not made by a mouse drag is published once it rests this long. */
const IDLE_SETTLE_MS = 300;

/** One box per text line: client rects come one per text span. */
export const mergeLines = (rects: { left: number; top: number; right: number; bottom: number }[]) => {
  const lines: { left: number; top: number; right: number; bottom: number }[] = [];
  for (const rect of [...rects].sort((a, b) => a.top - b.top || a.left - b.left)) {
    const height = rect.bottom - rect.top;
    const line = lines.find((l) => Math.abs(l.top - rect.top) < height / 2);
    if (line) {
      line.left = Math.min(line.left, rect.left);
      line.right = Math.max(line.right, rect.right);
      line.top = Math.min(line.top, rect.top);
      line.bottom = Math.max(line.bottom, rect.bottom);
    } else {
      // Fields copied one by one: DOMRect's are prototype getters, `{...rect}` is empty.
      lines.push({ left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom });
    }
  }
  return lines;
};

/**
 * The text as a reader means it: words split across a line break by a hyphen
 * are joined, line breaks and runs of whitespace become single spaces,
 * NUL characters pdf.js leaves in some fonts are dropped.
 */
export const normalizeSelectedText = (raw: string): string =>
  raw
    .replace(/\0/g, '')
    .normalize('NFKC')
    .replace(/(\p{L})-\s*\n\s*(\p{Ll})/gu, '$1$2')
    .replace(/\s+/g, ' ')
    .trim();

const clamp01 = (value: number) => Math.min(1, Math.max(0, Number(value.toFixed(5))));

export class TextSelectionController {
  readonly #layers = new Map<HTMLElement, HTMLElement>(); // text layer → its endOfContent
  readonly #onChange: (state: SelectionState) => void;
  readonly #abort = new AbortController();
  #pointerDown = false;
  #prevRange: Range | null = null;
  #settleTimer: ReturnType<typeof setTimeout> | null = null;
  #state: SelectionState = { kind: 'none' };

  constructor(onChange: (state: SelectionState) => void) {
    this.#onChange = onChange;
    const { signal } = this.#abort;
    document.addEventListener('pointerdown', this.#onPointerDown, { signal, capture: true });
    document.addEventListener('pointerup', this.#onPointerUp, { signal });
    // Touch: a long-press selection ends in pointercancel, and dragging the
    // selection handles sends no pointer events at all; the idle settle in
    // #onSelectionChange publishes those.
    document.addEventListener('pointercancel', this.#onPointerCancel, { signal });
    window.addEventListener('blur', this.#onPointerUp, { signal });
    document.addEventListener('keyup', this.#onKeyUp, { signal });
    document.addEventListener('selectionchange', this.#onSelectionChange, { signal });
  }

  get state(): SelectionState {
    return this.#state;
  }

  /** Adopts a rendered text layer. Returns the function that releases it. */
  register(layer: HTMLElement): () => void {
    let end = layer.querySelector<HTMLElement>(':scope > .endOfContent');
    if (!end) {
      end = document.createElement('div');
      end.className = 'endOfContent';
      layer.append(end);
    }
    this.#layers.set(layer, end);
    const onMouseDown = () => layer.classList.add('selecting');
    const onCopy = (event: ClipboardEvent) => {
      const text = normalizeSelectedText(document.getSelection()?.toString() ?? '');
      if (!text || !event.clipboardData) return;
      event.clipboardData.setData('text/plain', text);
      event.preventDefault();
    };
    layer.addEventListener('mousedown', onMouseDown);
    layer.addEventListener('copy', onCopy);
    return () => {
      layer.removeEventListener('mousedown', onMouseDown);
      layer.removeEventListener('copy', onCopy);
      this.#layers.delete(layer);
    };
  }

  /** Drops the browser selection and the published one. */
  clear(): void {
    document.getSelection()?.removeAllRanges();
    this.#publish({ kind: 'none' });
  }

  dispose(): void {
    this.#abort.abort();
    if (this.#settleTimer) clearTimeout(this.#settleTimer);
    this.#layers.clear();
  }

  // ---- guard ---------------------------------------------------------------
  #reset = (end: HTMLElement, layer: HTMLElement) => {
    layer.append(end);
    end.style.width = '';
    end.style.height = '';
    layer.classList.remove('selecting');
  };

  #resetAll() {
    this.#layers.forEach(this.#reset);
  }

  #onPointerDown = (event: PointerEvent) => {
    this.#pointerDown = true;
    // A press on a text layer starts a new gesture: hide the menu meanwhile.
    const target = event.target as Element | null;
    if (target?.closest?.('.textLayer') && this.#state.kind !== 'selecting') this.#publish({ kind: 'selecting' });
  };

  #onPointerUp = () => {
    if (!this.#pointerDown) return;
    this.#pointerDown = false;
    this.#resetAll();
    this.#settle();
  };

  #onPointerCancel = () => {
    this.#pointerDown = false;
    this.#scheduleSettle();
  };

  #onKeyUp = () => {
    if (this.#pointerDown) return;
    this.#resetAll();
  };

  /** Publish once the selection stops changing (keyboard, touch handles). */
  #scheduleSettle() {
    if (this.#settleTimer) clearTimeout(this.#settleTimer);
    this.#settleTimer = setTimeout(() => this.#settle(), IDLE_SETTLE_MS);
  }

  #onSelectionChange = () => {
    const selection = document.getSelection();
    const empty = !selection || selection.rangeCount === 0;
    if (empty) this.#resetAll();
    else this.#markSelectingLayers(selection);
    // A click elsewhere removed or collapsed it: the published selection is gone.
    if ((empty || selection.isCollapsed) && !this.#pointerDown && this.#state.kind === 'selected')
      this.#publish({ kind: 'none' });
    // Not from a mouse drag (keyboard, touch handles, programmatic): settle when idle.
    if (!empty && !selection.isCollapsed && !this.#pointerDown) this.#scheduleSettle();
    if (!empty && !this.#isFirefox()) this.#guardMovingEnd(selection.getRangeAt(0));
  };

  /** Layers the selection touches get `.selecting`; Firefox makes one range per page. */
  #markSelectingLayers(selection: Selection) {
    const active = new Set<HTMLElement>();
    for (let i = 0; i < selection.rangeCount; i++) {
      const range = selection.getRangeAt(i);
      for (const layer of this.#layers.keys()) if (range.intersectsNode(layer)) active.add(layer);
    }
    for (const [layer, end] of this.#layers) {
      if (active.has(layer)) layer.classList.add('selecting');
      else this.#reset(end, layer);
    }
  }

  /**
   * Firefox limits the jump on its own. Detected as pdf.js does: an
   * `.endOfContent` (user-select: none) reports `-moz-user-select: none`
   * only in Firefox.
   */
  #isFirefox() {
    const end = this.#layers.values().next().value;
    return !!end && getComputedStyle(end).getPropertyValue('-moz-user-select') === 'none';
  }

  /** Moves `.endOfContent` right after the span under the selection's moving end. */
  #guardMovingEnd(range: Range) {
    const prev = this.#prevRange;
    this.#prevRange = range.cloneRange();
    const modifyStart =
      !!prev &&
      (range.compareBoundaryPoints(Range.END_TO_END, prev) === 0 ||
        range.compareBoundaryPoints(Range.START_TO_END, prev) === 0);
    const anchor = movingAnchor(range, modifyStart);
    const parent = anchor?.parentElement;
    const layer = parent?.closest<HTMLElement>('.textLayer');
    const end = layer ? this.#layers.get(layer) : undefined;
    if (!anchor || !parent || !layer || !end) return;
    end.style.width = layer.style.width;
    end.style.height = layer.style.height;
    parent.insertBefore(end, modifyStart ? anchor : anchor.nextSibling);
  }

  // ---- model -----------------------------------------------------------------
  #settle() {
    if (this.#settleTimer) clearTimeout(this.#settleTimer);
    this.#settleTimer = null;
    const selection = this.#read();
    if (selection) this.#publish({ kind: 'selected', selection });
    else if (this.#state.kind !== 'none') this.#publish({ kind: 'none' });
  }

  #publish(state: SelectionState) {
    const prev = this.#state;
    if (prev.kind === state.kind && prev.kind !== 'selected') return;
    if (
      prev.kind === 'selected' &&
      state.kind === 'selected' &&
      prev.selection.text === state.selection.text &&
      prev.selection.page === state.selection.page
    )
      return;
    this.#state = state;
    this.#onChange(state);
  }

  /** The current browser selection as page-fraction boxes, if it lies on our text layers. */
  #read(): ISelectionInfo | null {
    const selection = document.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
    const text = normalizeSelectedText(selection.toString());
    if (!text) return null;
    const ranges = Array.from({ length: selection.rangeCount }, (_, i) => selection.getRangeAt(i));
    const segments = [...this.#layers.keys()]
      .map((layer) => segmentOf(layer, ranges))
      .filter((segment): segment is ISelectionInfo['segments'][number] => segment !== null)
      .sort((a, b) => a.page - b.page);
    if (!segments.length) return null; // the selection is outside the pages
    return { text, page: segments[0].page, segments };
  }
}

/**
 * The node whose neighbourhood the selection is being extended in: the start
 * container when the start moves, else the end container (or, for an end at
 * offset 0, the last non-empty node before it).
 */
const movingAnchor = (range: Range, modifyStart: boolean): Element | null => {
  let anchor: Node | null = modifyStart ? range.startContainer : range.endContainer;
  if (anchor?.nodeType === Node.TEXT_NODE) anchor = anchor.parentNode;
  if (!modifyStart && range.endOffset === 0) {
    do {
      while (anchor && !anchor.previousSibling) anchor = anchor.parentNode;
      anchor = anchor?.previousSibling ?? null;
    } while (anchor && !anchor.childNodes.length);
  }
  return anchor as Element | null;
};

/** Client rects of the selected part of each text node of `layer`. */
const selectedRects = (layer: HTMLElement, range: Range): DOMRect[] => {
  const rects: DOMRect[] = [];
  const walker = document.createTreeWalker(layer, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!range.intersectsNode(node)) continue;
    const part = document.createRange();
    part.selectNodeContents(node);
    if (node === range.startContainer) part.setStart(node, range.startOffset);
    if (node === range.endContainer) part.setEnd(node, range.endOffset);
    for (const rect of part.getClientRects()) if (rect.width > 0 && rect.height > 0) rects.push(rect);
  }
  return rects;
};

/** The selection's line boxes on the page of `layer` (page fractions), or null. */
const segmentOf = (layer: HTMLElement, ranges: Range[]): ISelectionInfo['segments'][number] | null => {
  const body = layer.parentElement;
  const page = Number(body?.dataset.page);
  if (!body || !Number.isInteger(page)) return null;
  const rects = ranges.filter((range) => range.intersectsNode(layer)).flatMap((range) => selectedRects(layer, range));
  const bounds = body.getBoundingClientRect();
  if (!rects.length || !bounds.width || !bounds.height) return null;
  const boxes: IPageBox[] = mergeLines(rects).map((r) => ({
    x0: clamp01((r.left - bounds.left) / bounds.width),
    y0: clamp01((r.top - bounds.top) / bounds.height),
    x1: clamp01((r.right - bounds.left) / bounds.width),
    y1: clamp01((r.bottom - bounds.top) / bounds.height),
  }));
  return { page, boxes };
};
