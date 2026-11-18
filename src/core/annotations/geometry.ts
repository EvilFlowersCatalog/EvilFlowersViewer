// Bounds, hit testing and transforms of ink objects, in layer units.
import { isLine, isShape, isStroke, type InkBox, type InkObject, type InkPoint } from './model';

const box = (x0: number, y0: number, x1: number, y1: number): InkBox => ({
  x: Math.min(x0, x1),
  y: Math.min(y0, y1),
  w: Math.abs(x1 - x0),
  h: Math.abs(y1 - y0),
});

/** The object's visual bounds, stroke width included. */
export const bounds = (o: InkObject): InkBox => {
  const pad = o.kind === 'mark' || o.kind === 'note' || o.kind === 'raw' ? 0 : o.width / 2;
  if (isStroke(o)) {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const [x, y] of o.points) {
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
    if (!o.points.length) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad };
  }
  if (isShape(o)) return { x: o.x - pad, y: o.y - pad, w: o.w + 2 * pad, h: o.h + 2 * pad };
  if (isLine(o)) {
    const b = box(o.x1, o.y1, o.x2, o.y2);
    // An arrow's head reaches past the shaft.
    const extra = o.kind === 'arrow' ? pad + arrowHead(o.width) : pad;
    return { x: b.x - extra, y: b.y - extra, w: b.w + 2 * extra, h: b.h + 2 * extra };
  }
  if (o.kind === 'note') return { x: o.x, y: o.y, w: o.size, h: o.size };
  return { ...o.box };
};

/** Bounds of several objects together, or null for none. */
export const unionBounds = (objects: InkObject[]): InkBox | null => {
  if (!objects.length) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const o of objects) {
    const b = bounds(o);
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w);
    y1 = Math.max(y1, b.y + b.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
};

/** Length of an arrow's head for a shaft of `width`. */
export const arrowHead = (width: number) => Math.max(8, width * 4);

/** Distance from p to the segment a–b. */
export const distanceToSegment = (
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
) => {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};

const distanceToPolyline = (px: number, py: number, points: InkPoint[]) => {
  if (points.length === 1) return Math.hypot(px - points[0][0], py - points[0][1]);
  let best = Infinity;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    best = Math.min(best, distanceToSegment(px, py, ax, ay, bx, by));
  }
  return best;
};

const inside = (px: number, py: number, b: InkBox, slack = 0) =>
  px >= b.x - slack && px <= b.x + b.w + slack && py >= b.y - slack && py <= b.y + b.h + slack;

/**
 * Whether the point touches the object: on its line for strokes and outlines,
 * anywhere inside for filled marks, notes and unknown elements.
 */
export const hitTest = (o: InkObject, px: number, py: number, tolerance: number): boolean => {
  // Unknown elements are kept and shown but have no known shape: never hit
  // (their bounds are the whole page, which would block every gesture).
  if (o.kind === 'raw') return false;
  const reach = o.width / 2 + tolerance;
  if (isStroke(o)) {
    if (!inside(px, py, bounds(o), tolerance)) return false;
    return distanceToPolyline(px, py, o.points) <= reach;
  }
  if (isLine(o)) return distanceToSegment(px, py, o.x1, o.y1, o.x2, o.y2) <= reach;
  if (o.kind === 'mark' || o.kind === 'note') return inside(px, py, bounds(o), tolerance);
  if (o.kind === 'rect') {
    if (!inside(px, py, o, reach)) return false;
    const fromEdge = Math.min(
      Math.abs(px - o.x),
      Math.abs(px - (o.x + o.w)),
      Math.abs(py - o.y),
      Math.abs(py - (o.y + o.h))
    );
    return fromEdge <= reach;
  }
  // ellipse: distance to the outline, approximated along the ray from the centre
  const rx = o.w / 2;
  const ry = o.h / 2;
  const cx = o.x + rx;
  const cy = o.y + ry;
  if (rx < 0.5 || ry < 0.5) return distanceToSegment(px, py, o.x, o.y, o.x + o.w, o.y + o.h) <= reach;
  const angle = Math.atan2((py - cy) / ry, (px - cx) / rx);
  const ex = cx + rx * Math.cos(angle);
  const ey = cy + ry * Math.sin(angle);
  return Math.hypot(px - ex, py - ey) <= reach;
};

/** The topmost object under the point (objects are in paint order). */
export const objectAt = (objects: InkObject[], px: number, py: number, tolerance: number) => {
  for (let i = objects.length - 1; i >= 0; i--) {
    if (hitTest(objects[i], px, py, tolerance)) return objects[i];
  }
  return null;
};

/** Whether the object's bounds overlap the box (marquee selection). Unknown elements never do. */
export const touchesBox = (o: InkObject, b: InkBox) => {
  if (o.kind === 'raw') return false;
  const ob = bounds(o);
  return ob.x <= b.x + b.w && ob.x + ob.w >= b.x && ob.y <= b.y + b.h && ob.y + ob.h >= b.y;
};

/** The object moved by dx, dy. Unknown elements do not move. */
export const translate = <T extends InkObject>(o: T, dx: number, dy: number): T => {
  if (isStroke(o)) return { ...o, points: o.points.map(([x, y, p]) => [x + dx, y + dy, p] as InkPoint) };
  if (isShape(o) || o.kind === 'note') return { ...o, x: o.x + dx, y: o.y + dy };
  if (isLine(o)) return { ...o, x1: o.x1 + dx, y1: o.y1 + dy, x2: o.x2 + dx, y2: o.y2 + dy };
  return o;
};

/**
 * The object with every coordinate mapped from box `from` to box `to`
 * (resizing a selection). Stroke widths and note pins keep their size.
 */
export const mapBox = <T extends InkObject>(o: T, from: InkBox, to: InkBox): T => {
  const sx = from.w ? to.w / from.w : 1;
  const sy = from.h ? to.h / from.h : 1;
  const mx = (x: number) => to.x + (x - from.x) * sx;
  const my = (y: number) => to.y + (y - from.y) * sy;
  if (isStroke(o)) return { ...o, points: o.points.map(([x, y, p]) => [mx(x), my(y), p] as InkPoint) };
  if (isShape(o)) {
    const b = box(mx(o.x), my(o.y), mx(o.x + o.w), my(o.y + o.h));
    return { ...o, ...b };
  }
  if (isLine(o)) return { ...o, x1: mx(o.x1), y1: my(o.y1), x2: mx(o.x2), y2: my(o.y2) };
  if (o.kind === 'note') return { ...o, x: mx(o.x), y: my(o.y) };
  return o;
};

export type Corner = 'nw' | 'ne' | 'sw' | 'se';

/**
 * The selection box after dragging one corner to (px, py); the opposite
 * corner stays. With `keepAspect` the box keeps its proportions.
 */
export const resizeBox = (b: InkBox, corner: Corner, px: number, py: number, keepAspect: boolean, min = 4): InkBox => {
  const ax = corner.includes('w') ? b.x + b.w : b.x;
  const ay = corner.includes('n') ? b.y + b.h : b.y;
  let w = Math.max(min, Math.abs(px - ax));
  let h = Math.max(min, Math.abs(py - ay));
  if (keepAspect && b.w > 0 && b.h > 0) {
    const s = Math.max(w / b.w, h / b.h);
    w = b.w * s;
    h = b.h * s;
  }
  const x = corner.includes('w') ? ax - w : ax;
  const y = corner.includes('n') ? ay - h : ay;
  return { x, y, w, h };
};

