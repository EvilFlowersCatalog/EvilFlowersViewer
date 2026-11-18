// The reader's own marks on a page, as objects (#156). Coordinates are in the
// page layer's own space: the `viewBox` of its SVG. New layers use the page
// size at scale 1 (PDF points); layers saved by older viewers keep the pixel
// size they were drawn at. The layer is stretched over the page either way,
// so zoom never rewrites a coordinate.

/** x, y, pressure (0–1; 0.5 when the device reports none). */
export type InkPoint = [number, number, number];

export interface InkBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InkSpace {
  w: number;
  h: number;
}

export type InkKind =
  | 'pen'
  | 'highlighter'
  | 'rect'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'mark'
  | 'note'
  | 'raw';

interface InkBase {
  id: string;
  color: string;
  /** Stroke width in layer units. */
  width: number;
  /** The reader's comment on this object. */
  note?: string;
  /**
   * Text of the page under the object when it was made or last moved. Lets a
   * list, a search or an AI feature say what the mark is about without the
   * page's text layer.
   */
  text?: string;
  /** Epoch ms. */
  created?: number;
}

export interface InkStroke extends InkBase {
  kind: 'pen' | 'highlighter';
  points: InkPoint[];
  /** Even width, no pressure or speed shaping (strokes from before #156 keep their look). */
  uniform?: boolean;
}

export interface InkShape extends InkBase {
  /** `mark` is a filled, translucent box: a text highlight. */
  kind: 'rect' | 'ellipse' | 'mark';
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface InkLine extends InkBase {
  kind: 'line' | 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** A sticky note: a square pin with its top-left at x, y; its text is `note`. */
export interface InkNote extends InkBase {
  kind: 'note';
  x: number;
  y: number;
  size: number;
}

/** An element this viewer does not know, kept verbatim so a save never loses it. */
export interface InkRaw extends InkBase {
  kind: 'raw';
  markup: string;
  box: InkBox;
}

export type InkObject = InkStroke | InkShape | InkLine | InkNote | InkRaw;

/** Side of a note's pin on a 612-unit wide (US Letter) page. */
export const NOTE_SIZE = 18;

export const isStroke = (o: InkObject): o is InkStroke => o.kind === 'pen' || o.kind === 'highlighter';
export const isShape = (o: InkObject): o is InkShape =>
  o.kind === 'rect' || o.kind === 'ellipse' || o.kind === 'mark';
export const isLine = (o: InkObject): o is InkLine => o.kind === 'line' || o.kind === 'arrow';

let counter = 0;
export const newInkId = () =>
  `ink-${Date.now().toString(36)}-${(counter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Pin size for a layer: the same share of the page's width whatever the layer's units. */
export const noteSize = (space: InkSpace) => NOTE_SIZE * (space.w / 612 || 1);
