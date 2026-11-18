// How strokes look and what a held stroke snaps to.
import { getStroke } from 'perfect-freehand';
import { arrowHead } from './geometry';
import type { InkBox, InkLine, InkPoint } from './model';

const round = (n: number) => Math.round(n * 100) / 100;

/** True when the device reported no pressure (mouse, some touch screens). */
export const hasNoPressure = (points: InkPoint[]) => points.every((p) => p[2] === 0.5);

/**
 * Filled outline of a pen stroke as an SVG path: thicker where the pen
 * pressed harder. Without real pressure the speed of the stroke stands in
 * for it, as with a fountain pen.
 */
export const penOutline = (points: InkPoint[], width: number, done = true, uniform = false): string => {
  if (!points.length) return '';
  const outline = getStroke(points, {
    size: width,
    thinning: uniform ? 0 : 0.55,
    smoothing: 0.5,
    streamline: uniform ? 0 : 0.4,
    simulatePressure: !uniform && hasNoPressure(points),
    start: { cap: true, taper: 0 },
    end: { cap: true, taper: 0 },
    last: done,
  });
  return polygonPath(outline);
};

/**
 * Path through outline points, `M`/`L` only and without `Z`: a fill closes
 * it anyway, and viewers before #156 rescale paths by reading exactly
 * `Mx,y Lx,y …` tokens, so they keep drawing new layers correctly. The
 * outline is dense enough that straight segments look smooth.
 */
export const polygonPath = (outline: number[][]): string =>
  outline.length ? `M${outline.map(([x, y]) => `${round(x)},${round(y)}`).join(' L')}` : '';

/** Open path through the points, for strokes drawn with an SVG stroke (highlighter). */
export const polylinePath = (points: InkPoint[]): string => {
  if (!points.length) return '';
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M${round(x)},${round(y)} L${round(x + 0.01)},${round(y)}`;
  }
  return `M${points.map(([x, y]) => `${round(x)},${round(y)}`).join(' L')}`;
};

/** Shaft and open head of an arrow, as one stroked path. */
export const arrowPath = (o: Pick<InkLine, 'x1' | 'y1' | 'x2' | 'y2' | 'width'>): string => {
  const angle = Math.atan2(o.y2 - o.y1, o.x2 - o.x1);
  const head = arrowHead(o.width);
  const spread = Math.PI / 7;
  const hx1 = o.x2 - head * Math.cos(angle - spread);
  const hy1 = o.y2 - head * Math.sin(angle - spread);
  const hx2 = o.x2 - head * Math.cos(angle + spread);
  const hy2 = o.y2 - head * Math.sin(angle + spread);
  return (
    `M${round(o.x1)},${round(o.y1)} L${round(o.x2)},${round(o.y2)} ` +
    `M${round(hx1)},${round(hy1)} L${round(o.x2)},${round(o.y2)} L${round(hx2)},${round(hy2)}`
  );
};

/**
 * Drops samples closer than `minGap` to the previous kept one. A pen sends
 * 120–240 samples a second; most add nothing to the shape but bytes.
 */
export const thinPoints = (points: InkPoint[], minGap: number): InkPoint[] => {
  if (points.length < 3) return points.slice();
  const kept: InkPoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = kept[kept.length - 1];
    if (Math.hypot(points[i][0] - px, points[i][1] - py) >= minGap) kept.push(points[i]);
  }
  kept.push(points[points.length - 1]);
  return kept;
};

const pathLength = (points: InkPoint[]) => {
  let length = 0;
  for (let i = 1; i < points.length; i++)
    length += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
  return length;
};

export type SnappedShape =
  | { kind: 'line'; x1: number; y1: number; x2: number; y2: number }
  | ({ kind: 'rect' | 'ellipse' } & InkBox);

/**
 * What a stroke the reader drew and then held still was meant to be: a
 * straight line, a rectangle or an ellipse, or null when it is none of them
 * clearly enough. `minSize` is the smallest shape worth snapping.
 */
export const recognizeShape = (points: InkPoint[], minSize: number): SnappedShape | null => {
  if (points.length < 3) return null;
  const [sx, sy] = points[0];
  const [ex, ey] = points[points.length - 1];
  const length = pathLength(points);
  const chord = Math.hypot(ex - sx, ey - sy);
  if (length < minSize) return null;

  // Nearly as long as its chord: a line.
  if (chord >= minSize && length / chord < 1.12) return { kind: 'line', x1: sx, y1: sy, x2: ex, y2: ey };

  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of points) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  const w = x1 - x0;
  const h = y1 - y0;
  const diagonal = Math.hypot(w, h);
  // Closed: the stroke ends near where it began, and it is not a thin scribble.
  if (diagonal < minSize || chord > diagonal * 0.25 || Math.min(w, h) < minSize / 2) return null;

  const rx = w / 2;
  const ry = h / 2;
  const cx = x0 + rx;
  const cy = y0 + ry;
  const scale = Math.min(w, h);
  let ellipseError = 0;
  let rectError = 0;
  for (const [x, y] of points) {
    const r = Math.hypot((x - cx) / rx, (y - cy) / ry);
    ellipseError += Math.abs(r - 1);
    rectError += Math.min(Math.abs(x - x0), Math.abs(x - x1), Math.abs(y - y0), Math.abs(y - y1)) / scale;
  }
  ellipseError /= points.length;
  rectError /= points.length;
  const box = { x: x0, y: y0, w, h };
  if (rectError < 0.06 && rectError < ellipseError) return { kind: 'rect', ...box };
  if (ellipseError < 0.12) return { kind: 'ellipse', ...box };
  return null;
};

/** Snap a line's angle to multiples of 45° (Shift while drawing). */
export const snapAngle = (x1: number, y1: number, x2: number, y2: number) => {
  const length = Math.hypot(x2 - x1, y2 - y1);
  const step = Math.PI / 4;
  const angle = Math.round(Math.atan2(y2 - y1, x2 - x1) / step) * step;
  return { x2: x1 + length * Math.cos(angle), y2: y1 + length * Math.sin(angle) };
};
