// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import {
  bounds,
  hitTest,
  mapBox,
  objectAt,
  parseLayer,
  recognizeShape,
  resizeBox,
  serializeLayer,
  thinPoints,
  touchesBox,
  translate,
  type InkObject,
  type InkPoint,
  type InkRaw,
  type InkStroke,
} from '.';

// A layer exactly as the viewer before #156 saved it (EditCanvas.vue):
// pixels of the page at the zoom it was drawn at, no data attributes.
const LEGACY = `<svg xmlns="http://www.w3.org/2000/svg" class="absolute" width="918" height="1188">
<path opacity="1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="0,1" fill="none" stroke="#f02727" d="M10,20 L30,40 L50,45 "></path>
<path opacity="0.3" stroke-width="12" fill="none" stroke="#ffe100" d="M100,200 L300,200 "></path>
<line opacity="1" stroke-width="3" fill="none" stroke="#000000" x1="5" y1="5" x2="105" y2="5"></line>
<rect opacity="1" stroke-width="2" fill="none" stroke="#50aaff" rx="50%" x="400" y="400" width="100" height="60"></rect>
<rect opacity="1" stroke-width="2" fill="none" stroke="#50aaff" rx="0" x="10" y="600" width="80" height="40"></rect>
<rect x="20" y="700" width="300" height="14" fill="#ffe100" opacity="0.3"></rect>
<polyline points="1,1 2,2" stroke="red"></polyline>
<script>alert(1)</script>
</svg>`;

describe('parseLayer: layers saved before #156', () => {
  const { space, objects } = parseLayer(LEGACY);

  it('keeps the space they were drawn in', () => {
    expect(space).toEqual({ w: 918, h: 1188 });
  });

  it('reads each element as an object of the matching kind', () => {
    expect(objects.map((o) => o.kind)).toEqual(['pen', 'highlighter', 'line', 'ellipse', 'rect', 'mark', 'raw']);
  });

  it('reads stroke points, colour and width from the path', () => {
    const pen = objects[0] as InkStroke;
    expect(pen.points).toEqual([
      [10, 20, 0.5],
      [30, 40, 0.5],
      [50, 45, 0.5],
    ]);
    expect(pen.color).toBe('#f02727');
    expect(pen.width).toBe(2);
    // An old stroke keeps its even width (no pressure shaping).
    expect(pen.uniform).toBe(true);
  });

  it('keeps unknown elements verbatim and drops scripts', () => {
    const raw = objects[6] as InkRaw;
    expect(raw.markup).toContain('polyline');
    expect(objects.some((o) => o.kind === 'raw' && o.markup.includes('script'))).toBe(false);
  });
});

describe('serializeLayer / parseLayer round trip', () => {
  const space = { w: 612, h: 792 };
  const objects: InkObject[] = [
    { id: 'a', kind: 'pen', color: '#1d1d1d', width: 3, points: [[1, 2, 0.3], [5, 6, 0.8], [9, 9, 0.6]], note: 'Why "this" & <that>?' },
    { id: 'b', kind: 'highlighter', color: '#ffe100', width: 12, points: [[10, 10, 0.5], [90, 10, 0.5]], text: 'relational algebra' },
    { id: 'c', kind: 'rect', color: '#50aaff', width: 2, x: 10, y: 20, w: 30, h: 40 },
    { id: 'd', kind: 'ellipse', color: '#50aaff', width: 2, x: 100, y: 120, w: 60, h: 20 },
    { id: 'e', kind: 'line', color: '#000000', width: 2, x1: 0, y1: 0, x2: 50, y2: 50 },
    { id: 'f', kind: 'arrow', color: '#f02727', width: 2, x1: 10, y1: 10, x2: 80, y2: 30 },
    { id: 'g', kind: 'mark', color: '#ffe100', width: 0, x: 5, y: 5, w: 100, h: 12 },
    { id: 'h', kind: 'note', color: '#ffe100', width: 0, x: 400, y: 50, size: 18, note: 'Check against chapter 3', created: 1763400000000 },
  ];
  const svg = serializeLayer(objects, space);
  const back = parseLayer(svg);

  it('is plain SVG with width/height equal to the viewBox (older viewers render it)', () => {
    expect(svg).toMatch(/^<svg [^>]*width="612" height="792" viewBox="0 0 612 792"/);
  });

  it('gives the same objects back', () => {
    expect(back.space).toEqual(space);
    expect(back.objects.map(({ kind, id }) => `${kind}:${id}`)).toEqual(objects.map(({ kind, id }) => `${kind}:${id}`));
    expect(back.objects[0]).toMatchObject({ note: 'Why "this" & <that>?', width: 3, color: '#1d1d1d' });
    expect((back.objects[0] as any).points).toEqual(objects[0].kind === 'pen' ? objects[0].points : []);
    expect(back.objects[1]).toMatchObject({ text: 'relational algebra' });
    expect(back.objects[3]).toMatchObject({ x: 100, y: 120, w: 60, h: 20 });
    expect(back.objects[5]).toMatchObject({ x1: 10, y1: 10, x2: 80, y2: 30 });
    expect(back.objects[7]).toMatchObject({ note: 'Check against chapter 3', size: 18, created: 1763400000000 });
  });

  it('never throws on malformed input', () => {
    expect(parseLayer('<svg><path d=')).toEqual({ space: null, objects: [], unreadable: true });
    expect(parseLayer('')).toEqual({ space: null, objects: [] });
  });

  it('rejects colours that are not colours', () => {
    const evil = '<svg width="10" height="10"><line x1="0" y1="0" x2="5" y2="5" stroke="url(javascript:x)" /></svg>';
    expect(parseLayer(evil).objects[0].color).toBe('#000000');
  });
});

describe('geometry', () => {
  const stroke: InkObject = { id: 's', kind: 'pen', color: '#000', width: 4, points: [[0, 0, 0.5], [100, 0, 0.5]] };
  const rect: InkObject = { id: 'r', kind: 'rect', color: '#000', width: 2, x: 10, y: 10, w: 50, h: 50 };

  it('hits a stroke near its line, not far from it', () => {
    expect(hitTest(stroke, 50, 3, 1)).toBe(true);
    expect(hitTest(stroke, 50, 10, 1)).toBe(false);
  });

  it('hits an outline on its edge, not in its empty middle', () => {
    expect(hitTest(rect, 10, 30, 2)).toBe(true);
    expect(hitTest(rect, 35, 35, 2)).toBe(false);
  });

  it('picks the topmost object', () => {
    const top: InkObject = { id: 't', kind: 'mark', color: '#ff0', width: 0, x: 0, y: -5, w: 100, h: 10 };
    expect(objectAt([stroke, top], 50, 0, 1)?.id).toBe('t');
  });

  it('moves and maps objects between boxes', () => {
    expect(bounds(translate(rect, 5, -5))).toEqual({ x: 14, y: 4, w: 52, h: 52 });
    const mapped = mapBox(rect, { x: 10, y: 10, w: 50, h: 50 }, { x: 0, y: 0, w: 100, h: 25 });
    expect(mapped).toMatchObject({ x: 0, y: 0, w: 100, h: 25 });
  });

  it('resizes from the opposite corner, keeping aspect on request', () => {
    const b = { x: 0, y: 0, w: 100, h: 50 };
    expect(resizeBox(b, 'se', 200, 60, false)).toEqual({ x: 0, y: 0, w: 200, h: 60 });
    expect(resizeBox(b, 'nw', -100, 40, true)).toEqual({ x: -100, y: -50, w: 200, h: 100 });
  });

  it('never hits unknown elements (their box is the whole page)', () => {
    const raw: InkObject = { id: 'x', kind: 'raw', color: '#000', width: 1, markup: '<polyline/>', box: { x: 0, y: 0, w: 600, h: 800 } };
    expect(hitTest(raw, 10, 10, 5)).toBe(false);
    expect(touchesBox(raw, { x: 0, y: 0, w: 50, h: 50 })).toBe(false);
  });

  it('finds objects a marquee touches', () => {
    expect(touchesBox(rect, { x: 55, y: 55, w: 10, h: 10 })).toBe(true);
    expect(touchesBox(rect, { x: 70, y: 70, w: 10, h: 10 })).toBe(false);
  });
});

describe('recognizeShape', () => {
  const circle: InkPoint[] = Array.from({ length: 40 }, (_, i) => {
    const a = (i / 39) * Math.PI * 2;
    return [100 + 50 * Math.cos(a), 100 + 30 * Math.sin(a), 0.5];
  });
  const square: InkPoint[] = [
    [0, 0, 0.5], [50, 0, 0.5], [100, 1, 0.5], [100, 50, 0.5], [99, 100, 0.5],
    [50, 100, 0.5], [0, 100, 0.5], [1, 50, 0.5], [0, 2, 0.5],
  ];

  it('snaps a nearly straight stroke to a line', () => {
    expect(recognizeShape([[0, 0, 0.5], [50, 2, 0.5], [100, 0, 0.5]], 10)).toMatchObject({ kind: 'line', x2: 100 });
  });

  it('snaps a closed round stroke to an ellipse', () => {
    expect(recognizeShape(circle, 10)).toMatchObject({ kind: 'ellipse', w: expect.closeTo(100, 0), h: expect.closeTo(60, 0) });
  });

  it('snaps a closed square stroke to a rectangle', () => {
    expect(recognizeShape(thinPoints(square, 0), 10)).toMatchObject({ kind: 'rect', x: 0, y: 0, w: 100, h: 100 });
  });

  it('leaves a scribble alone', () => {
    const zigzag: InkPoint[] = [[0, 0, 0.5], [20, 40, 0.5], [40, 0, 0.5], [60, 40, 0.5], [80, 0, 0.5]];
    expect(recognizeShape(zigzag, 10)).toBeNull();
  });
});
