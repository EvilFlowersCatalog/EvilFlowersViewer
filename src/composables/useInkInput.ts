// Pointer, pen and touch input of one page's ink layer (#156,
// docs/diagrams/state-ink-input.puml). One gesture = one pointer from down to
// up; it previews locally and commits once, as one undo step and one save.
//
// Who may draw:
//  · a pen always draws (and its eraser end erases, whatever the tool);
//  · a mouse draws with its main button;
//  · a finger draws until a pen was seen; then fingers scroll and pinch
//    (palm rejection), unless the reader turns finger drawing back on.
// A second finger during a finger stroke cancels it: that is a pinch.
import { computed, onBeforeUnmount, ref, shallowRef, type Ref } from 'vue';
import {
  bounds,
  objectAt,
  recognizeShape,
  resizeBox,
  snapAngle,
  thinPoints,
  touchesBox,
  translate,
  newInkId,
  noteSize,
  mapBox,
  type Corner,
  type InkBox,
  type InkObject,
  type InkPoint,
  type InkSpace,
  type SnappedShape,
} from '@/core/annotations';
import { EDIT_TOOL } from '@/assets/utils/enums';
import { useDocumentStore, useInkStore } from '@/stores';

type Input = 'pen' | 'mouse' | 'touch';

type Gesture =
  | { mode: 'stroke'; kind: 'pen' | 'highlighter'; points: InkPoint[] }
  | { mode: 'shape'; x0: number; y0: number; x1: number; y1: number }
  | { mode: 'erase'; ids: Set<string>; last: [number, number] }
  | { mode: 'move'; x0: number; y0: number; dx: number; dy: number; moved: boolean }
  | { mode: 'resize'; corner: Corner; from: InkBox; to: InkBox }
  | { mode: 'marquee'; x0: number; y0: number; box: InkBox; additive: boolean };

/** Still for this long while drawing: the stroke snaps to a shape. */
const HOLD_MS = 600;
/** Movement (px) that ends a hold. */
const HOLD_SLOP = 4;
/** Hit tolerance, px on screen. */
const HIT_PX = 6;

export const useInkInput = (options: {
  page: () => number;
  svg: Ref<SVGSVGElement | null>;
  /** The layer's coordinate space. */
  space: () => InkSpace;
  /** Text of the page under a box of the layer, for the object's `text`. */
  textUnder: (box: InkBox) => string;
  /** A note was placed: open its editor. */
  onNotePlaced?: (id: string) => void;
}) => {
  const docStore = useDocumentStore();
  const inkStore = useInkStore();

  const gesture = shallowRef<Gesture | null>(null);
  const pointerId = ref<number | null>(null);
  const input = ref<Input>('mouse');
  /** The shape a held stroke snapped to (preview until the pen lifts). */
  const snapped = shallowRef<SnappedShape | null>(null);
  const eraserAt = ref<[number, number] | null>(null);
  const hoverId = ref<string | null>(null);
  /** Pressed with the pen's eraser end. */
  let penEraser = false;
  const touches = new Set<number>();
  let holdTimer: ReturnType<typeof setTimeout> | null = null;
  let holdFrom: { x: number; y: number } | null = null;

  const rect = () => options.svg.value?.getBoundingClientRect() ?? null;
  /** Layer units per CSS pixel. */
  const unitsPerPx = () => {
    const r = rect();
    return r?.width ? options.space().w / r.width : 1;
  };
  const toLayer = (clientX: number, clientY: number): [number, number] => {
    const r = rect();
    if (!r?.width || !r.height) return [0, 0];
    const { w, h } = options.space();
    return [((clientX - r.left) / r.width) * w, ((clientY - r.top) / r.height) * h];
  };
  const pressureOf = (event: PointerEvent) =>
    event.pointerType === 'pen' && event.pressure > 0 ? Math.min(1, event.pressure) : 0.5;

  const clearHold = () => {
    if (holdTimer) clearTimeout(holdTimer);
    holdTimer = null;
  };
  const armHold = (x: number, y: number) => {
    clearHold();
    holdFrom = { x, y };
    holdTimer = setTimeout(() => {
      const g = gesture.value;
      if (g?.mode !== 'stroke') return;
      const shape = recognizeShape(g.points, 12 * unitsPerPx());
      // A highlighter only straightens; it never becomes a box.
      if (shape && (g.kind === 'pen' || shape.kind === 'line')) snapped.value = shape;
    }, HOLD_MS);
  };

  const tool = () => docStore.editTool;
  const style = () => inkStore.currentStyle ?? { color: '#000000', width: 2 };

  const finish = () => {
    clearHold();
    const svg = options.svg.value;
    if (svg && pointerId.value !== null && svg.hasPointerCapture?.(pointerId.value))
      svg.releasePointerCapture(pointerId.value);
    gesture.value = null;
    pointerId.value = null;
    snapped.value = null;
    penEraser = false;
  };

  const cancel = () => finish();

  // ---- down -----------------------------------------------------------------------
  /**
   * The select tool: a handle resizes the selection; a mark is selected
   * (Shift toggles it in the selection) and moved; empty paper starts a marquee.
   */
  const startSelect = (event: PointerEvent, page: number, x: number, y: number, tolerance: number): Gesture => {
    const handle = (event.target as Element | null)?.getAttribute?.('data-ink-handle') as Corner | null;
    const sel = inkStore.selection?.page === page ? inkStore.selection : null;
    if (handle && sel && inkStore.selectionBounds) {
      const from = inkStore.selectionBounds;
      return { mode: 'resize', corner: handle, from, to: from };
    }
    const hit = objectAt(inkStore.objectsOn(page), x, y, tolerance);
    if (!hit) {
      if (!event.shiftKey) inkStore.clearSelection();
      return { mode: 'marquee', x0: x, y0: y, box: { x, y, w: 0, h: 0 }, additive: event.shiftKey };
    }
    const ids = sel?.ids ?? [];
    const already = ids.includes(hit.id);
    if (event.shiftKey) inkStore.select(page, already ? ids.filter((id) => id !== hit.id) : [...ids, hit.id]);
    else if (!already) inkStore.select(page, [hit.id]);
    return { mode: 'move', x0: x, y0: y, dx: 0, dy: 0, moved: false };
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!docStore.drawMode || tool() === EDIT_TOOL.MOUSE) return;
    const page = options.page();
    if (event.pointerType === 'touch') {
      touches.add(event.pointerId);
      // A second finger: the gesture is a pinch, not a stroke.
      if (touches.size > 1) {
        if (input.value === 'touch') cancel();
        return;
      }
      if (!inkStore.fingerDraws) return;
    }
    if (event.pointerType === 'pen') inkStore.notePen();
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (gesture.value) return; // one gesture at a time
    if (!inkStore.editable(page)) return;

    input.value = (event.pointerType as Input) || 'mouse';
    penEraser = event.pointerType === 'pen' && (event.button === 5 || (event.buttons & 32) === 32);
    const [x, y] = toLayer(event.clientX, event.clientY);
    const tolerance = HIT_PX * unitsPerPx();

    if (penEraser || tool() === EDIT_TOOL.ERASER) {
      gesture.value = { mode: 'erase', ids: new Set(), last: [x, y] };
      eraseAt(x, y, x, y);
    } else if (tool() === EDIT_TOOL.PEN || tool() === EDIT_TOOL.HIGHLIGHTER) {
      gesture.value = {
        mode: 'stroke',
        kind: tool() === EDIT_TOOL.PEN ? 'pen' : 'highlighter',
        points: [[x, y, pressureOf(event)]],
      };
      armHold(event.clientX, event.clientY);
    } else if (tool() === EDIT_TOOL.SHAPE) {
      gesture.value = { mode: 'shape', x0: x, y0: y, x1: x, y1: y };
    } else if (tool() === EDIT_TOOL.NOTE) {
      // No mousedown afterwards: it would move focus off the note's editor.
      event.preventDefault();
      placeNote(x, y);
      return;
    } else if (tool() === EDIT_TOOL.SELECT) {
      gesture.value = startSelect(event, page, x, y, tolerance);
    } else return;

    event.preventDefault();
    pointerId.value = event.pointerId;
    options.svg.value?.setPointerCapture?.(event.pointerId);
  };

  // ---- move --------------------------------------------------------------------------
  const samples = (event: PointerEvent): PointerEvent[] => {
    const coalesced = event.getCoalescedEvents?.() ?? [];
    return coalesced.length ? coalesced : [event];
  };

  const eraseAt = (ax: number, ay: number, bx: number, by: number) => {
    const g = gesture.value;
    if (g?.mode !== 'erase') return;
    const reach = 8 * unitsPerPx();
    const objects = inkStore.objectsOn(options.page()).filter((o) => !g.ids.has(o.id));
    // Walk the segment so a fast swipe does not jump over thin strokes.
    const steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / (reach / 2)));
    let found = false;
    for (let i = 0; i <= steps; i++) {
      const x = ax + ((bx - ax) * i) / steps;
      const y = ay + ((by - ay) * i) / steps;
      for (const o of objects) {
        if (!g.ids.has(o.id) && objectAt([o], x, y, reach)) {
          g.ids.add(o.id);
          found = true;
        }
      }
    }
    g.last = [bx, by];
    if (found) gesture.value = { ...g }; // repaint the preview
  };

  const onPointerMove = (event: PointerEvent) => {
    const g = gesture.value;
    const [px, py] = toLayer(event.clientX, event.clientY);
    // Hover feedback without a gesture.
    if (!g) {
      if (!docStore.drawMode) return;
      if (tool() === EDIT_TOOL.ERASER) eraserAt.value = [px, py];
      if (tool() === EDIT_TOOL.SELECT)
        hoverId.value = objectAt(inkStore.objectsOn(options.page()), px, py, HIT_PX * unitsPerPx())?.id ?? null;
      return;
    }
    if (event.pointerId !== pointerId.value) return;

    switch (g.mode) {
      case 'stroke': {
        const added = samples(event).map((s) => {
          const [x, y] = toLayer(s.clientX, s.clientY);
          return [x, y, pressureOf(s)] as InkPoint;
        });
        if (holdFrom && Math.hypot(event.clientX - holdFrom.x, event.clientY - holdFrom.y) > HOLD_SLOP) {
          snapped.value = null;
          armHold(event.clientX, event.clientY);
        }
        if (snapped.value) return; // held: the shape is shown, the stroke waits
        gesture.value = { ...g, points: [...g.points, ...added] };
        break;
      }
      case 'shape': {
        let x1 = px;
        let y1 = py;
        if (event.shiftKey) {
          if (inkStore.shapeKind === 'line' || inkStore.shapeKind === 'arrow') ({ x2: x1, y2: y1 } = snapAngle(g.x0, g.y0, px, py));
          else {
            const side = Math.max(Math.abs(px - g.x0), Math.abs(py - g.y0));
            x1 = g.x0 + Math.sign(px - g.x0 || 1) * side;
            y1 = g.y0 + Math.sign(py - g.y0 || 1) * side;
          }
        }
        gesture.value = { ...g, x1, y1 };
        break;
      }
      case 'erase':
        eraserAt.value = [px, py];
        eraseAt(g.last[0], g.last[1], px, py);
        break;
      case 'move': {
        const dx = px - g.x0;
        const dy = py - g.y0;
        const moved = g.moved || Math.hypot(dx, dy) > 2 * unitsPerPx();
        gesture.value = { ...g, dx: moved ? dx : 0, dy: moved ? dy : 0, moved };
        break;
      }
      case 'resize':
        gesture.value = { ...g, to: resizeBox(g.from, g.corner, px, py, event.shiftKey || isStrokeOnly()) };
        break;
      case 'marquee':
        gesture.value = {
          ...g,
          box: { x: Math.min(g.x0, px), y: Math.min(g.y0, py), w: Math.abs(px - g.x0), h: Math.abs(py - g.y0) },
        };
        break;
    }
  };

  // Strokes keep their proportions when resized (handwriting must not shear).
  const isStrokeOnly = () => inkStore.selectedObjects.every((o) => o.kind === 'pen' || o.kind === 'highlighter');

  // ---- up --------------------------------------------------------------------------------
  const created = (object: InkObject): InkObject => {
    // What the mark is about: the text under it (a note: the line it is pinned to).
    const box = bounds(object);
    const text = options.textUnder(
      object.kind === 'note' ? { x: 0, y: box.y, w: options.space().w, h: box.h } : box
    );
    return { ...object, created: Date.now(), ...(text ? { text } : {}) };
  };

  const shapeObject = (kind: SnappedShape['kind'] | 'arrow', g: { x0: number; y0: number; x1: number; y1: number }): InkObject => {
    const { color, width } = style();
    const base = { id: newInkId(), color, width };
    if (kind === 'line' || kind === 'arrow') return { ...base, kind, x1: g.x0, y1: g.y0, x2: g.x1, y2: g.y1 };
    return {
      ...base,
      kind,
      x: Math.min(g.x0, g.x1),
      y: Math.min(g.y0, g.y1),
      w: Math.abs(g.x1 - g.x0),
      h: Math.abs(g.y1 - g.y0),
    };
  };

  const placeNote = (x: number, y: number) => {
    const page = options.page();
    const space = options.space();
    const size = noteSize(space);
    const note: InkObject = {
      id: newInkId(),
      kind: 'note',
      color: inkStore.styles.note.color,
      width: 0,
      x: Math.max(0, Math.min(space.w - size, x - size / 2)),
      y: Math.max(0, Math.min(space.h - size, y - size / 2)),
      size,
    };
    const placed = created(note);
    if (inkStore.add(page, placed, space, input.value)) {
      inkStore.select(page, [placed.id]);
      options.onNotePlaced?.(placed.id);
    }
  };

  const onPointerUp = (event: PointerEvent) => {
    if (event.pointerType === 'touch') touches.delete(event.pointerId);
    const g = gesture.value;
    if (!g || event.pointerId !== pointerId.value) return;
    const page = options.page();
    const space = options.space();
    const minimum = 3 * unitsPerPx();

    switch (g.mode) {
      case 'stroke': {
        const shape = snapped.value;
        const { color, width } = style();
        if (shape) {
          const object =
            g.kind === 'highlighter' && shape.kind === 'line'
              ? { id: newInkId(), kind: 'highlighter' as const, color, width, points: [[shape.x1, shape.y1, 0.5], [shape.x2, shape.y2, 0.5]] as InkPoint[] }
              : shape.kind === 'line'
                ? shapeObject('line', { x0: shape.x1, y0: shape.y1, x1: shape.x2, y1: shape.y2 })
                : shapeObject(shape.kind, { x0: shape.x, y0: shape.y, x1: shape.x + shape.w, y1: shape.y + shape.h });
          inkStore.add(page, created(object), space, input.value);
        } else {
          const points = thinPoints(g.points, 0.6 * unitsPerPx());
          inkStore.add(page, created({ id: newInkId(), kind: g.kind, color, width, points }), space, input.value);
        }
        break;
      }
      case 'shape': {
        if (Math.hypot(g.x1 - g.x0, g.y1 - g.y0) >= minimum)
          inkStore.add(page, created(shapeObject(inkStore.shapeKind, g)), space, input.value);
        break;
      }
      case 'erase':
        if (g.ids.size) inkStore.removeIds(page, g.ids);
        break;
      case 'move':
        if (g.moved && (g.dx || g.dy)) inkStore.moveSelection(g.dx, g.dy);
        break;
      case 'resize':
        if (g.to.w !== g.from.w || g.to.h !== g.from.h || g.to.x !== g.from.x || g.to.y !== g.from.y)
          inkStore.resizeSelection(g.to);
        break;
      case 'marquee': {
        const hits = inkStore
          .objectsOn(page)
          .filter((o) => touchesBox(o, g.box))
          .map((o) => o.id);
        const base = g.additive && inkStore.selection?.page === page ? inkStore.selection.ids : [];
        if (g.box.w > minimum || g.box.h > minimum) inkStore.select(page, [...new Set([...base, ...hits])]);
        break;
      }
    }
    finish();
  };

  const onPointerCancel = (event: PointerEvent) => {
    if (event.pointerType === 'touch') touches.delete(event.pointerId);
    if (event.pointerId === pointerId.value) cancel();
  };

  const onPointerLeave = () => {
    eraserAt.value = null;
    hoverId.value = null;
  };

  onBeforeUnmount(clearHold);

  // ---- what the layer shows while a gesture runs ------------------------------------------------
  /** The page's objects as they look mid-gesture (moved, resized, erased). */
  const shown = computed<InkObject[]>(() => {
    const objects = inkStore.objectsOn(options.page());
    const g = gesture.value;
    if (!g) return objects;
    const sel = inkStore.selection;
    const selected = new Set(sel?.page === options.page() ? sel.ids : []);
    if (g.mode === 'erase') return objects.filter((o) => !g.ids.has(o.id));
    if (g.mode === 'move' && g.moved)
      return objects.map((o) => (selected.has(o.id) ? translate(o, g.dx, g.dy) : o));
    if (g.mode === 'resize') return objects.map((o) => (selected.has(o.id) ? mapBox(o, g.from, g.to) : o));
    return objects;
  });

  /** The object being drawn, as it would be committed now. */
  const live = computed<InkObject | null>(() => {
    const g = gesture.value;
    const { color, width } = style();
    if (g?.mode === 'stroke') {
      const shape = snapped.value;
      if (shape)
        return shape.kind === 'line'
          ? { id: 'live', kind: g.kind === 'highlighter' ? 'highlighter' : 'line', color, width, ...(g.kind === 'highlighter' ? { points: [[shape.x1, shape.y1, 0.5], [shape.x2, shape.y2, 0.5]] } : { x1: shape.x1, y1: shape.y1, x2: shape.x2, y2: shape.y2 }) } as InkObject
          : shapeObject(shape.kind, { x0: shape.x, y0: shape.y, x1: shape.x + shape.w, y1: shape.y + shape.h });
      return { id: 'live', kind: g.kind, color, width, points: g.points };
    }
    if (g?.mode === 'shape') return shapeObject(inkStore.shapeKind, g);
    return null;
  });

  const marquee = computed(() => (gesture.value?.mode === 'marquee' ? gesture.value.box : null));
  const resizing = computed(() => (gesture.value?.mode === 'resize' ? gesture.value.to : null));
  const busy = computed(() => gesture.value !== null);
  const erasing = computed(() => gesture.value?.mode === 'erase' || tool() === EDIT_TOOL.ERASER);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    shown,
    live,
    marquee,
    resizing,
    busy,
    erasing,
    eraserAt,
    hoverId,
    unitsPerPx,
  };
};
