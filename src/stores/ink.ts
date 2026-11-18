// The reader's drawings as objects (#156, docs/diagrams/component-annotation-layer.puml).
//
// One store for every page: objects, the selection, undo/redo across pages
// and a save queue per page. Each page's InkLayer renders from here and
// commits finished gestures here; nothing is saved per pointer sample.
// Persistence goes through the host's `editPackage` unchanged: one SVG per
// page (core/annotations/svg.ts). Without an editPackage the drawings live
// for the session.
import { computed, reactive, ref, shallowRef, toRaw, watch } from 'vue';
import { defineStore } from 'pinia';
// Only the small geometry and model helpers load with the viewer; the SVG
// codec (and perfect-freehand behind it) is fetched with the first layer.
import { mapBox, translate, unionBounds } from '@/core/annotations/geometry';
import { newInkId, type InkBox, type InkObject, type InkSpace } from '@/core/annotations/model';
const codec = () => import('@/core/annotations/svg');
import { EDIT_TOOL } from '@/assets/utils/enums';
import type { IAnnotationChangeInfo, IPageBox } from '@/assets/utils/interfaces';
import { DEFAULT_HIGHLIGHT_COLOR } from '@/assets/utils/constans';
import { useDocumentStore } from './document';
import { useViewerStore } from './viewer';

export type ShapeKind = 'rect' | 'ellipse' | 'line' | 'arrow';

/** Colour and width each tool remembers (widths in page points). */
export interface ToolStyle {
  color: string;
  width: number;
}

interface PageInk {
  objects: InkObject[];
  /** The layer's coordinate space; null until loaded or first drawn on. */
  space: InkSpace | null;
  /** The host's record of this page's layer. */
  layerId: string | null;
  status: 'loading' | 'ready' | 'locked';
}

interface HistoryStep {
  page: number;
  before: InkObject[];
  after: InkObject[];
}

const MAX_HISTORY = 100;
/**
 * Autosave waits for a pause in the work, not for each stroke: a reader
 * writing a word makes a dozen strokes in a few seconds, and one save of the
 * page after them is enough. Leaving draw mode, hiding the tab or opening
 * another document saves at once.
 */
const SAVE_IDLE_MS = 1500;
/** After a failed save, one quiet retry later (and again on the next change). */
const RETRY_MS = 10_000;

export const useInkStore = defineStore('ink', () => {
  const docStore = useDocumentStore();
  const viewerStore = useViewerStore();

  // ---- tools ------------------------------------------------------------------
  const shapeKind = ref<ShapeKind>('rect');
  const styles = reactive<Record<'pen' | 'highlighter' | 'shape' | 'note', ToolStyle>>({
    pen: { color: '#1d1d1d', width: 2 },
    highlighter: { color: DEFAULT_HIGHLIGHT_COLOR, width: 14 },
    shape: { color: '#f02727', width: 2 },
    note: { color: DEFAULT_HIGHLIGHT_COLOR, width: 0 },
  });
  const styleKey = (tool: EDIT_TOOL) =>
    tool === EDIT_TOOL.PEN
      ? 'pen'
      : tool === EDIT_TOOL.HIGHLIGHTER
        ? 'highlighter'
        : tool === EDIT_TOOL.SHAPE
          ? 'shape'
          : tool === EDIT_TOOL.NOTE
            ? 'note'
            : null;
  /** The style of the tool in hand, or null for tools that draw nothing. */
  const currentStyle = computed(() => {
    const key = styleKey(docStore.editTool);
    return key ? styles[key] : null;
  });

  /**
   * A pen touched the page this session. From then on fingers scroll and
   * zoom instead of drawing (palm rejection, as in note-taking apps), unless
   * the reader turns finger drawing back on.
   */
  const penSeen = ref(false);
  const fingerDraws = ref(true);
  const notePen = () => {
    if (penSeen.value) return;
    penSeen.value = true;
    fingerDraws.value = false;
  };

  // ---- pages ----------------------------------------------------------------------
  const pages = shallowRef(new Map<number, PageInk>());
  const touch = () => (pages.value = new Map(pages.value));

  const pageInk = (page: number) => pages.value.get(page) ?? null;
  const objectsOn = (page: number): InkObject[] => pages.value.get(page)?.objects ?? [];

  const setPage = (page: number, patch: Partial<PageInk>) => {
    const current = pages.value.get(page) ?? { objects: [], space: null, layerId: null, status: 'ready' as const };
    pages.value.set(page, { ...current, ...patch });
    touch();
  };

  // ---- host persistence ---------------------------------------------------------------
  // Saved drawings show whenever the host stores them; drawing itself also
  // needs `config.edit` (the rail and the E key check that).
  const persisting = computed(() => !!viewerStore.editPackage);

  // Everything tied to one open document. Async work captures the session it
  // started in and drops its result when the document has changed since, so
  // a save still in flight from the previous book never writes into this one.
  interface Session {
    groupId: string | null;
    lookup: Promise<string | null> | null;
    bulkLoaded: boolean;
    /** getGroupsFunc failed: what is stored is unknown, so nothing may be saved over it. */
    unknown: boolean;
  }
  const newSession = (): Session => ({ groupId: null, lookup: null, bulkLoaded: false, unknown: false });
  let session = newSession();
  const current = (s: Session) => s === session;

  /** The host's existing group, or null; one is created only on the first save. */
  const findGroup = (s: Session = session) => {
    s.lookup ??= (async () => {
      const pkg = viewerStore.editPackage;
      if (!pkg) return null;
      try {
        const groups = await pkg.getGroupsFunc();
        s.groupId = groups[0]?.id ?? null;
        if (s.groupId && pkg.getLayersFunc && current(s)) await warm(s, s.groupId);
      } catch (error) {
        console.error('Failed to load annotation groups:', error);
        s.unknown = true;
      }
      return s.groupId;
    })();
    return s.lookup;
  };

  const ensureGroup = async (s: Session) => {
    await findGroup(s);
    if (s.groupId) return s.groupId;
    if (s.unknown) throw new Error('annotation groups could not be loaded');
    const { response } = await viewerStore.editPackage!.saveGroupFunc('edit-group');
    s.groupId = response.id;
    return s.groupId;
  };

  const adopt = async (s: Session, page: number, svg: string | null | undefined, layerId: string | null) => {
    const parsed = (await codec()).parseLayer(svg);
    if (!current(s)) return;
    // An unreadable layer stays exactly as stored: it is shown nowhere, and
    // the page refuses edits rather than save an empty layer over it.
    setPage(page, {
      objects: parsed.objects,
      space: parsed.space,
      layerId,
      status: parsed.unreadable ? 'locked' : 'ready',
    });
  };

  /** Every layer of the group in one request (getLayersFunc). */
  const warm = async (s: Session, group: string) => {
    try {
      const layers = await viewerStore.editPackage!.getLayersFunc!(group);
      for (const { page, id, svg } of layers) {
        if (!current(s)) return;
        if (!pages.value.get(page)?.objects.length) await adopt(s, page, svg, id);
      }
      s.bulkLoaded = true;
    } catch (error) {
      console.error('Failed to load annotation layers in bulk:', error);
    }
  };

  /** Loads a page's drawing once (a mounted page asks for it). */
  const ensurePage = async (page: number) => {
    if (pages.value.has(page) || !persisting.value) return;
    const s = session;
    setPage(page, { status: 'loading' });
    const group = await findGroup(s);
    if (!current(s) || pages.value.get(page)?.status !== 'loading') return; // the bulk load brought it
    // Unknown state: do not let an edit overwrite what may be stored.
    if (s.unknown) return setPage(page, { status: 'locked' });
    if (!group || s.bulkLoaded) return setPage(page, { status: 'ready' });
    try {
      const layer = await viewerStore.editPackage!.getLayerFunc(page, group);
      await adopt(s, page, layer?.svg, layer?.id ?? null);
    } catch (error) {
      console.error(`Failed to load the drawing of page ${page}:`, error);
      if (current(s)) setPage(page, { status: 'locked' });
    }
  };

  // Save queue: at most one request per page in flight; changes made
  // meanwhile are saved once it returns (the latest state wins).
  const timers = new Map<number, ReturnType<typeof setTimeout>>();
  const inFlight = new Map<number, Promise<void>>();
  const dirty = new Set<number>();
  const failed = new Set<number>();
  const saving = ref(0);
  /**
   * What the rail shows, quietly: `pending` (changes wait for a pause),
   * `saving`, `saved`, or `error` (kept until a save of that page succeeds).
   * `idle` before the first change.
   */
  const saveState = ref<'idle' | 'pending' | 'saving' | 'saved' | 'error'>('idle');
  const refreshSaveState = () => {
    if (failed.size) saveState.value = 'error';
    else if (saving.value) saveState.value = 'saving';
    else if (timers.size || dirty.size) saveState.value = 'pending';
    else if (saveState.value !== 'idle') saveState.value = 'saved';
  };

  const scheduleSave = (page: number, delay = SAVE_IDLE_MS) => {
    if (!persisting.value) return;
    clearTimeout(timers.get(page));
    timers.set(page, setTimeout(() => void flush(page), delay));
    refreshSaveState();
  };

  const flush = async (page: number): Promise<void> => {
    clearTimeout(timers.get(page));
    timers.delete(page);
    if (inFlight.has(page)) {
      dirty.add(page);
      return inFlight.get(page);
    }
    const run = save(page).finally(() => {
      inFlight.delete(page);
      if (dirty.delete(page)) void flush(page);
      refreshSaveState();
    });
    inFlight.set(page, run);
    refreshSaveState();
    return run;
  };

  const save = async (page: number) => {
    // Everything this save needs is taken now: the document may change
    // while it awaits, and it must still go to the document it came from.
    const s = session;
    const ink = pages.value.get(page);
    const pkg = viewerStore.editPackage;
    if (!ink || !ink.space || !pkg || ink.status === 'locked') return;
    saving.value++;
    refreshSaveState();
    try {
      const svg = (await codec()).serializeLayer(toRaw(ink.objects), ink.space);
      const group = await ensureGroup(s);
      if (ink.layerId) await pkg.updateLayerFunc(ink.layerId, svg, group, page);
      else {
        const layer = await pkg.saveLayerFunc(svg, group, page);
        if (layer?.id && current(s)) setPage(page, { layerId: layer.id });
      }
      if (current(s)) failed.delete(page);
    } catch (error) {
      console.error(`Failed to save the drawing of page ${page}:`, error);
      // The drawing stays on the page; a quiet retry follows, and any new
      // change saves again too. (A save of a closed document is not retried.)
      if (current(s)) {
        failed.add(page);
        if (!timers.has(page)) scheduleSave(page, RETRY_MS);
      }
    } finally {
      saving.value--;
    }
  };

  /** Saves everything pending now (leaving draw mode or the document, hiding the tab). */
  const flushAll = async () => {
    const pending = [...new Set([...timers.keys(), ...failed])];
    await Promise.allSettled([...pending.map(flush), ...inFlight.values()]);
  };

  /** Retry failed saves now (the rail's status, when it shows an error). */
  const retrySaves = () => void flushAll();

  // ---- changes and history ---------------------------------------------------------------
  const undoStack = ref<HistoryStep[]>([]);
  const redoStack = ref<HistoryStep[]>([]);
  const canUndo = computed(() => undoStack.value.length > 0);
  const canRedo = computed(() => redoStack.value.length > 0);

  const editable = (page: number) => pages.value.get(page)?.status !== 'locked' && pages.value.get(page)?.status !== 'loading';

  const emitChange = (info: IAnnotationChangeInfo) => viewerStore.events.emit('annotation-change', info);

  const kindsOf = (objects: InkObject[]) => [...new Set(objects.map((o) => o.kind))];

  /**
   * Replaces a page's objects as one undoable step and saves the page.
   * `space` is the layer space for a page drawn on for the first time.
   */
  const commit = (
    page: number,
    after: InkObject[],
    change: Omit<IAnnotationChangeInfo, 'page' | 'count'>,
    space?: InkSpace
  ) => {
    if (!editable(page)) return false;
    const ink = pages.value.get(page);
    const before = ink?.objects ?? [];
    setPage(page, { objects: after, space: ink?.space ?? space ?? null });
    undoStack.value.push({ page, before, after });
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift();
    redoStack.value = [];
    scheduleSave(page);
    emitChange({ page, count: after.length, ...change });
    return true;
  };

  const step = (from: typeof undoStack, to: typeof undoStack, action: 'undo' | 'redo') => {
    const entry = from.value.pop();
    if (!entry) return;
    to.value.push(entry);
    const objects = action === 'undo' ? entry.before : entry.after;
    setPage(entry.page, { objects });
    scheduleSave(entry.page);
    selection.value = null;
    // Bring the change into view when it is on another page.
    if (entry.page !== docStore.activePage) docStore.goTo(entry.page, 'step');
    emitChange({ page: entry.page, action, kinds: kindsOf([...entry.before, ...entry.after]), count: objects.length });
  };
  const undo = () => step(undoStack, redoStack, 'undo');
  const redo = () => step(redoStack, undoStack, 'redo');

  // ---- object operations --------------------------------------------------------------------
  const add = (page: number, object: InkObject, space: InkSpace, input: IAnnotationChangeInfo['input']) => {
    const done = commit(page, [...objectsOn(page), object], { action: 'add', kinds: [object.kind], input }, space);
    return done;
  };

  const removeIds = (page: number, ids: Set<string>) => {
    const removed = objectsOn(page).filter((o) => ids.has(o.id));
    if (!removed.length) return;
    commit(page, objectsOn(page).filter((o) => !ids.has(o.id)), { action: 'remove', kinds: kindsOf(removed) });
    if (selection.value?.page === page) selection.value = null;
  };

  /** Replaces the given objects (by id) with new versions, as one step. */
  const replace = (page: number, changed: InkObject[]) => {
    if (!changed.length) return;
    const byId = new Map(changed.map((o) => [o.id, o]));
    commit(page, objectsOn(page).map((o) => byId.get(o.id) ?? o), { action: 'change', kinds: kindsOf(changed) });
  };

  /**
   * Highlight boxes (page fractions) as filled marks: the selection menu's
   * "Highlight" when the host stores no reader highlights.
   */
  const addMarks = (page: number, boxes: IPageBox[], space: InkSpace, text?: string) => {
    const target = pages.value.get(page)?.space ?? space;
    const marks: InkObject[] = boxes.map((box) => ({
      id: newInkId(),
      kind: 'mark',
      color: styles.highlighter.color,
      width: 0,
      x: box.x0 * target.w,
      y: box.y0 * target.h,
      w: (box.x1 - box.x0) * target.w,
      h: (box.y1 - box.y0) * target.h,
      created: Date.now(),
      ...(text ? { text } : {}),
    }));
    if (marks.length)
      commit(page, [...objectsOn(page), ...marks], { action: 'add', kinds: ['mark'], input: 'mouse' }, space);
  };

  // ---- selection ------------------------------------------------------------------------------
  const selection = ref<{ page: number; ids: string[] } | null>(null);
  const selectedObjects = computed(() => {
    const sel = selection.value;
    if (!sel) return [];
    const ids = new Set(sel.ids);
    return objectsOn(sel.page).filter((o) => ids.has(o.id));
  });
  const selectionBounds = computed<InkBox | null>(() => unionBounds(selectedObjects.value));

  const select = (page: number, ids: string[]) => {
    selection.value = ids.length ? { page, ids } : null;
  };
  const clearSelection = () => (selection.value = null);
  const selectAll = (page: number) => select(page, objectsOn(page).map((o) => o.id));

  const deleteSelection = () => {
    const sel = selection.value;
    if (sel) removeIds(sel.page, new Set(sel.ids));
  };

  const duplicateSelection = () => {
    const sel = selection.value;
    if (!sel || !selectedObjects.value.length) return;
    const offset = (pages.value.get(sel.page)?.space?.w ?? 612) * 0.02;
    const copies = selectedObjects.value
      .filter((o) => o.kind !== 'raw')
      .map((o) => ({ ...translate(o, offset, offset), id: newInkId(), created: Date.now() }));
    if (!copies.length) return;
    commit(sel.page, [...objectsOn(sel.page), ...copies], { action: 'add', kinds: kindsOf(copies), input: 'keyboard' });
    select(sel.page, copies.map((o) => o.id));
  };

  const moveSelection = (dx: number, dy: number) => {
    const sel = selection.value;
    if (sel) replace(sel.page, selectedObjects.value.map((o) => translate(o, dx, dy)));
  };

  const resizeSelection = (to: InkBox) => {
    const sel = selection.value;
    const from = selectionBounds.value;
    if (sel && from) replace(sel.page, selectedObjects.value.map((o) => mapBox(o, from, to)));
  };

  /**
   * The note of one object, by id: the editor saves its draft here whether
   * or not the object is still selected (the reader may have moved on).
   */
  const setNote = (page: number, id: string, note: string) => {
    const object = objectsOn(page).find((o) => o.id === id);
    if (!object || object.kind === 'raw' || (object.note ?? '') === note) return;
    const next = { ...object, note } as InkObject;
    if (!note) delete next.note;
    replace(page, [next]);
  };

  /** Colour, width or note of the selected objects. */
  const styleSelection =(patch: { color?: string; width?: number; note?: string }) => {
    if (!selection.value) return;
    const changed = selectedObjects.value
      .filter((o) => o.kind !== 'raw')
      .map((o) => {
        const next = { ...o, ...patch } as InkObject;
        if (patch.note !== undefined && !patch.note) delete next.note;
        return next;
      });
    replace(selection.value!.page, changed);
  };

  /** Brings the selection to the front (paint order). */
  const bringToFront = () => {
    const sel = selection.value;
    if (!sel) return;
    const ids = new Set(sel.ids);
    const all = objectsOn(sel.page);
    commit(sel.page, [...all.filter((o) => !ids.has(o.id)), ...all.filter((o) => ids.has(o.id))], {
      action: 'change',
      kinds: kindsOf(selectedObjects.value),
    });
  };

  // ---- lifecycle -------------------------------------------------------------------------------
  const reset = () => {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
    dirty.clear();
    failed.clear();
    saveState.value = 'idle';
    pages.value = new Map();
    undoStack.value = [];
    redoStack.value = [];
    selection.value = null;
    session = newSession();
  };

  // A new document starts with no drawings. Pending saves of the old one go
  // out first: flushAll starts each save synchronously, so every save has
  // taken its page and session before reset() swaps them.
  watch(
    () => docStore.pdf,
    () => {
      void flushAll();
      reset();
    }
  );
  // Leaving draw mode drops the selection and saves at once.
  watch(
    () => docStore.drawMode,
    (on) => {
      if (on) return;
      clearSelection();
      void flushAll();
    }
  );

  return {
    // tools
    shapeKind,
    styles,
    currentStyle,
    penSeen,
    fingerDraws,
    notePen,
    // pages
    pages,
    pageInk,
    objectsOn,
    ensurePage,
    editable,
    saveState,
    retrySaves,
    // changes
    add,
    commit,
    replace,
    removeIds,
    addMarks,
    undo,
    redo,
    canUndo,
    canRedo,
    // selection
    selection,
    selectedObjects,
    selectionBounds,
    select,
    clearSelection,
    selectAll,
    deleteSelection,
    duplicateSelection,
    moveSelection,
    resizeSelection,
    styleSelection,
    setNote,
    bringToFront,
    // lifecycle
    flushAll,
    reset,
  };
});
