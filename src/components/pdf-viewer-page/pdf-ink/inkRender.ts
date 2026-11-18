// SVG attributes of an ink object, the same drawing the wire format stores
// (core/annotations/svg.ts objectMarkup), as Vue bindings.
import {
  arrowPath,
  HIGHLIGHTER_OPACITY,
  MARK_OPACITY,
  penOutline,
  polylinePath,
  type InkObject,
} from '@/core/annotations';

export type InkDrawing =
  | { tag: 'path'; attrs: Record<string, string | number> }
  | { tag: 'rect'; attrs: Record<string, string | number> }
  | { tag: 'ellipse'; attrs: Record<string, string | number> }
  | { tag: 'line'; attrs: Record<string, string | number> }
  | { tag: 'raw'; markup: string }
  | { tag: 'note'; x: number; y: number; size: number; color: string; hasText: boolean };

// Objects are immutable (every change is a new object), so the outline of a
// stroke is computed once per version.
const cache = new WeakMap<InkObject, InkDrawing>();

const stroked = (o: InkObject) => ({
  fill: 'none',
  stroke: o.color,
  'stroke-width': o.width,
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round',
});

const build = (o: InkObject, live: boolean): InkDrawing => {
  switch (o.kind) {
    case 'pen':
      return { tag: 'path', attrs: { d: penOutline(o.points, o.width, !live, o.uniform), fill: o.color } };
    case 'highlighter':
      return {
        tag: 'path',
        attrs: { d: polylinePath(o.points), ...stroked(o), opacity: HIGHLIGHTER_OPACITY, class: 'efv-ink-multiply' },
      };
    case 'rect':
      return { tag: 'rect', attrs: { x: o.x, y: o.y, width: o.w, height: o.h, ...stroked(o) } };
    case 'mark':
      return {
        tag: 'rect',
        attrs: { x: o.x, y: o.y, width: o.w, height: o.h, fill: o.color, opacity: MARK_OPACITY, class: 'efv-ink-multiply' },
      };
    case 'ellipse':
      return {
        tag: 'ellipse',
        attrs: { cx: o.x + o.w / 2, cy: o.y + o.h / 2, rx: o.w / 2, ry: o.h / 2, ...stroked(o) },
      };
    case 'line':
      return { tag: 'line', attrs: { x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, ...stroked(o) } };
    case 'arrow':
      return { tag: 'path', attrs: { d: arrowPath(o), ...stroked(o) } };
    case 'note':
      return { tag: 'note', x: o.x, y: o.y, size: o.size, color: o.color, hasText: !!o.note };
    case 'raw':
      return { tag: 'raw', markup: o.markup };
  }
};

export const drawingOf = (o: InkObject, live = false): InkDrawing => {
  if (live) return build(o, true);
  let drawing = cache.get(o);
  if (!drawing) {
    drawing = build(o, false);
    cache.set(o, drawing);
  }
  return drawing;
};
