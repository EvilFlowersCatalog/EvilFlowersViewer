// The wire format: one SVG per page, as `IEditPackage` stores it (#156).
//
// Every object is one top-level element: the drawing as plain SVG (so any
// SVG renderer, an older viewer included, shows it) plus `data-efv-*`
// attributes with what makes it an object again (kind, id, raw points, the
// reader's note, the text under it). The root's width/height equal its
// viewBox: the layer's own coordinate space.
//
// Layers saved before #156 have no `data-efv-*`: bare <path>, <line> and
// <rect> in pixels of the page as it was drawn (root width/height). They are
// read as objects in that space, unchanged.
import {
  isLine,
  isShape,
  isStroke,
  newInkId,
  type InkObject,
  type InkPoint,
  type InkSpace,
} from './model';
import { arrowPath, penOutline, polylinePath } from './stroke';

export const INK_FORMAT = '2';
const SVG_NS = 'http://www.w3.org/2000/svg';

/** Opacity of highlighter strokes and of text-highlight marks. */
export const HIGHLIGHTER_OPACITY = 0.35;
export const MARK_OPACITY = 0.3;

export interface ParsedLayer {
  /** The layer's coordinate space, or null when the SVG does not say. */
  space: InkSpace | null;
  objects: InkObject[];
  /**
   * The stored SVG could not be read. The page must then stay as stored:
   * saving an empty layer over it would destroy what is there.
   */
  unreadable?: boolean;
}

// ---- reading ------------------------------------------------------------------

const COLOR = /^(#[0-9a-f]{3,8}|[a-z]{3,20}|rgba?\(\s*[\d.\s,%]+\))$/i;
export const safeColor = (value: string | null | undefined, fallback: string) =>
  value && COLOR.test(value.trim()) ? value.trim() : fallback;

const num = (value: string | null | undefined, fallback = 0) => {
  const n = parseFloat(value ?? '');
  return Number.isFinite(n) ? n : fallback;
};

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;
const numbers = (text: string | null) => (text?.match(NUMBER) ?? []).map(Number).filter(Number.isFinite);

/** Points stored as `x,y,p x,y,p …`. */
const readPoints = (text: string | null): InkPoint[] => {
  const points: InkPoint[] = [];
  for (const triple of (text ?? '').trim().split(/\s+/)) {
    const [x, y, p] = triple.split(',').map(Number);
    if (Number.isFinite(x) && Number.isFinite(y)) points.push([x, y, Number.isFinite(p) ? p : 0.5]);
  }
  return points;
};

/** Points of a legacy path: every coordinate pair of its `d`. */
const legacyPathPoints = (d: string | null): InkPoint[] => {
  const values = numbers(d);
  const points: InkPoint[] = [];
  for (let i = 0; i + 1 < values.length; i += 2) points.push([values[i], values[i + 1], 0.5]);
  return points;
};

const readSpace = (root: Element): InkSpace | null => {
  const box = numbers(root.getAttribute('viewBox'));
  if (box.length === 4 && box[2] > 0 && box[3] > 0) return { w: box[2], h: box[3] };
  const w = num(root.getAttribute('width'));
  const h = num(root.getAttribute('height'));
  return w > 0 && h > 0 ? { w, h } : null;
};

const common = (el: Element, fallbackColor: string) => {
  const note = el.getAttribute('data-efv-note');
  const text = el.getAttribute('data-efv-text');
  const created = num(el.getAttribute('data-efv-created'), NaN);
  return {
    id: el.getAttribute('data-efv-id') || newInkId(),
    color: safeColor(el.getAttribute('stroke') !== 'none' ? el.getAttribute('stroke') : el.getAttribute('fill'), fallbackColor),
    width: Math.max(0.1, num(el.getAttribute('data-efv-width') ?? el.getAttribute('stroke-width'), 2)),
    ...(note ? { note } : {}),
    ...(text ? { text } : {}),
    ...(Number.isFinite(created) ? { created } : {}),
  };
};

const fillColor = (el: Element) => safeColor(el.getAttribute('fill'), '#ffe100');

const readTagged = (el: Element, kind: string): InkObject | null => {
  const base = common(el, '#000000');
  switch (kind) {
    case 'pen':
      return {
        ...base,
        color: fillColor(el),
        kind,
        points: readPoints(el.getAttribute('data-efv-points')),
        ...(el.getAttribute('data-efv-uniform') ? { uniform: true } : {}),
      };
    case 'highlighter':
      return { ...base, kind, points: readPoints(el.getAttribute('data-efv-points')) };
    case 'rect':
    case 'mark': {
      const shape = {
        x: num(el.getAttribute('x')),
        y: num(el.getAttribute('y')),
        w: num(el.getAttribute('width')),
        h: num(el.getAttribute('height')),
      };
      return kind === 'mark' ? { ...base, color: fillColor(el), kind, ...shape } : { ...base, kind, ...shape };
    }
    case 'ellipse': {
      const rx = num(el.getAttribute('rx'));
      const ry = num(el.getAttribute('ry'));
      const x = num(el.getAttribute('cx')) - rx;
      const y = num(el.getAttribute('cy')) - ry;
      return { ...base, kind, x, y, w: 2 * rx, h: 2 * ry };
    }
    case 'line':
      return {
        ...base,
        kind,
        x1: num(el.getAttribute('x1')),
        y1: num(el.getAttribute('y1')),
        x2: num(el.getAttribute('x2')),
        y2: num(el.getAttribute('y2')),
      };
    case 'arrow': {
      const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = numbers(el.getAttribute('data-efv-line'));
      return { ...base, kind, x1, y1, x2, y2 };
    }
    case 'note': {
      const size = num(el.getAttribute('width'), 18);
      return { ...base, color: fillColor(el), kind, x: num(el.getAttribute('x')), y: num(el.getAttribute('y')), size };
    }
    default:
      return null;
  }
};

/** An element from before #156 (or from another tool), read by its tag. */
const readLegacy = (el: Element, space: InkSpace | null): InkObject => {
  const tag = el.localName.toLowerCase();
  const base = common(el, '#000000');
  const opacity = num(el.getAttribute('opacity'), 1);
  if (tag === 'path' && el.getAttribute('fill') === 'none') {
    const points = legacyPathPoints(el.getAttribute('d'));
    if (points.length)
      return opacity < 1 ? { ...base, kind: 'highlighter', points } : { ...base, kind: 'pen', points, uniform: true };
  }
  if (tag === 'line') {
    return {
      ...base,
      kind: 'line',
      x1: num(el.getAttribute('x1')),
      y1: num(el.getAttribute('y1')),
      x2: num(el.getAttribute('x2')),
      y2: num(el.getAttribute('y2')),
    };
  }
  if (tag === 'rect') {
    const box = {
      x: num(el.getAttribute('x')),
      y: num(el.getAttribute('y')),
      w: num(el.getAttribute('width')),
      h: num(el.getAttribute('height')),
    };
    const fill = el.getAttribute('fill');
    if (fill && fill !== 'none') return { ...base, color: fillColor(el), kind: 'mark', ...box };
    // The old circle tool drew a rect with rx="50%".
    const rx = el.getAttribute('rx') ?? '';
    return { ...base, kind: rx.endsWith('%') && parseFloat(rx) >= 50 ? 'ellipse' : 'rect', ...box };
  }
  // Anything else is kept as it is, so saving never drops it.
  return {
    ...base,
    kind: 'raw',
    markup: el.outerHTML,
    box: { x: 0, y: 0, w: space?.w ?? 0, h: space?.h ?? 0 },
  };
};

/** Reads a stored layer. Malformed SVG gives no objects, never an exception. */
export const parseLayer = (svg: string | null | undefined): ParsedLayer => {
  if (!svg?.trim()) return { space: null, objects: [] };
  let root: Element | null = null;
  try {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    // Browsers report malformed XML as a <parsererror> element, sometimes
    // inside the root; such a layer is unreadable as a whole.
    if (doc.getElementsByTagName('parsererror').length) return { space: null, objects: [], unreadable: true };
    root = doc.documentElement;
  } catch {
    return { space: null, objects: [], unreadable: true };
  }
  if (!root || root.localName !== 'svg') return { space: null, objects: [], unreadable: true };
  const space = readSpace(root);
  const objects: InkObject[] = [];
  for (const el of Array.from(root.children)) {
    const tag = el.localName.toLowerCase();
    // Never carry scripts or foreign content forward.
    if (tag === 'script' || tag === 'foreignobject' || tag === 'style') continue;
    const kind = el.getAttribute('data-efv-kind');
    const object = kind ? readTagged(el, kind) : readLegacy(el, space);
    if (object && (!isStroke(object) || object.points.length)) objects.push(object);
  }
  return { space, objects };
};

// ---- writing ------------------------------------------------------------------

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const r = (n: number) => String(Math.round(n * 100) / 100);

const attrs = (pairs: Record<string, string | number | undefined>) =>
  Object.entries(pairs)
    .filter(([, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}="${escape(typeof value === 'number' ? r(value) : value!)}"`)
    .join(' ');

const meta = (o: InkObject) => ({
  'data-efv-id': o.id,
  'data-efv-kind': o.kind,
  'data-efv-note': o.note || undefined,
  'data-efv-text': o.text ? o.text.slice(0, 500) : undefined,
  'data-efv-created': o.created,
});

const writePoints = (points: InkPoint[]) =>
  points.map(([x, y, p]) => `${r(x)},${r(y)},${Math.round(p * 100) / 100}`).join(' ');

/** The SVG element of one object (the same markup the layer renders). */
export const objectMarkup = (o: InkObject): string => {
  const stroke = { stroke: o.color, 'stroke-width': o.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' };
  if (isStroke(o)) {
    const points = writePoints(o.points);
    if (o.kind === 'pen')
      return `<path ${attrs({ ...meta(o), 'data-efv-points': points, 'data-efv-width': o.width, 'data-efv-uniform': o.uniform ? '1' : undefined, d: penOutline(o.points, o.width, true, o.uniform), fill: o.color, stroke: 'none' })}/>`;
    return `<path ${attrs({ ...meta(o), 'data-efv-points': points, d: polylinePath(o.points), fill: 'none', ...stroke, opacity: HIGHLIGHTER_OPACITY })}/>`;
  }
  if (isShape(o)) {
    if (o.kind === 'ellipse')
      return `<ellipse ${attrs({ ...meta(o), cx: o.x + o.w / 2, cy: o.y + o.h / 2, rx: o.w / 2, ry: o.h / 2, fill: 'none', ...stroke })}/>`;
    if (o.kind === 'mark')
      return `<rect ${attrs({ ...meta(o), x: o.x, y: o.y, width: o.w, height: o.h, fill: o.color, opacity: MARK_OPACITY })}/>`;
    return `<rect ${attrs({ ...meta(o), x: o.x, y: o.y, width: o.w, height: o.h, fill: 'none', ...stroke })}/>`;
  }
  if (isLine(o)) {
    if (o.kind === 'line')
      return `<line ${attrs({ ...meta(o), x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, ...stroke })}/>`;
    return `<path ${attrs({ ...meta(o), 'data-efv-line': `${r(o.x1)} ${r(o.y1)} ${r(o.x2)} ${r(o.y2)}`, d: arrowPath(o), fill: 'none', ...stroke })}/>`;
  }
  if (o.kind === 'note')
    return `<rect ${attrs({ ...meta(o), x: o.x, y: o.y, width: o.size, height: o.size, rx: o.size * 0.22, fill: o.color })}/>`;
  return o.markup;
};

/** The layer as stored: an SVG in its own space, one element per object. */
export const serializeLayer = (objects: InkObject[], space: InkSpace): string => {
  const root = attrs({
    xmlns: SVG_NS,
    width: space.w,
    height: space.h,
    viewBox: `0 0 ${r(space.w)} ${r(space.h)}`,
    'data-efv-ink': INK_FORMAT,
  });
  return `<svg ${root}>${objects.map(objectMarkup).join('')}</svg>`;
};
