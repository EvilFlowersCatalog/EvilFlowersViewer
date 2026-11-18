// Search: one engine and one state for the text search, the host's semantic
// search and results the host pushes in (e.g. passages an AI answer used).
// The panel, the find bar and the page highlight layer only read this store,
// and the host drives it through the controller, so they never disagree.
import { computed, ref, toRaw } from 'vue';
import { defineStore } from 'pinia';
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
import type { PageViewport } from 'pdfjs-dist/types/src/display/page_viewport';
import type {
  IHostSearchResult,
  IPageBox,
  ISearchHit,
  ISearchOptions,
  ISearchSummary,
  SEARCH_SOURCE,
} from '@/assets/utils/interfaces';
import { useDocumentStore } from './document';
import { useViewerStore } from './viewer';

const MAX_HITS = 5000;
const SNIPPET = 48; // characters of context on each side of a hit
const CONCURRENCY = 4; // pages whose text is extracted at once

// ---- Page text index ------------------------------------------------------

interface IndexedItem {
  start: number; // offsets of the item's text in PageIndex.text
  end: number;
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface PageIndex {
  page: number;
  text: string;
  items: IndexedItem[];
  viewport: PageViewport; // scale 1, for PDF space → page fractions
}

// The page text as a searchable string: each normalized char points back to
// the original offset it came from, so a match maps to exact item ranges.
interface NormalizedText {
  text: string;
  map: number[];
}

const isWordChar = (ch: string | undefined) => !!ch && /[\p{L}\p{N}_]/u.test(ch);

const normalizeChar = (ch: string, opts: Required<ISearchOptions>) => {
  let out = opts.ignoreDiacritics ? ch.normalize('NFD').replace(/\p{M}+/gu, '') : ch;
  if (!opts.caseSensitive) out = out.toLowerCase();
  return out;
};

/** Collapses whitespace, folds case and diacritics as the options say. */
const normalize = (source: string, opts: Required<ISearchOptions>): NormalizedText => {
  let text = '';
  const map: number[] = [];
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      if (text.length && text[text.length - 1] !== ' ') {
        text += ' ';
        map.push(i);
      }
      continue;
    }
    for (const out of normalizeChar(ch, opts)) {
      text += out;
      map.push(i);
    }
  }
  return { text, map };
};

const normalizeQuery = (query: string, opts: Required<ISearchOptions>) =>
  normalize(query, opts).text.trim();

const DEFAULTS: Required<ISearchOptions> = {
  caseSensitive: false,
  wholeWord: false,
  ignoreDiacritics: true,
};

// Where a character sits inside its text item: pdf.js gives only the item's
// total width, so the split is measured with a proportional font (close to
// most book faces), not as equal-width characters.
let measureCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
const measure = (text: string) => {
  if (!measureCtx) {
    measureCtx =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(1, 1).getContext('2d')
        : document.createElement('canvas').getContext('2d');
    if (measureCtx) measureCtx.font = '100px serif';
  }
  return measureCtx ? measureCtx.measureText(text).width : text.length;
};
const fractionAt = (str: string, offset: number) => {
  if (offset <= 0) return 0;
  if (offset >= str.length) return 1;
  const total = measure(str);
  return total > 0 ? measure(str.slice(0, offset)) / total : offset / str.length;
};

/** Boxes of original text offsets [start, end) on the page, as page fractions. */
const rectsFor = (index: PageIndex, start: number, end: number): IPageBox[] => {
  const rects: IPageBox[] = [];
  const { viewport } = index;
  for (const item of index.items) {
    if (item.end <= start || item.start >= end) continue;
    const length = item.end - item.start;
    if (!length) continue;
    const a = fractionAt(item.str, Math.max(start, item.start) - item.start);
    const b = fractionAt(item.str, Math.min(end, item.end) - item.start);
    const [m0, m1, m2, m3, ox, oy] = item.transform;
    // Unit vectors along and across the text (handles rotated text).
    const along = Math.hypot(m0, m1) || 1;
    const across = Math.hypot(m2, m3) || 1;
    const ux = m0 / along;
    const uy = m1 / along;
    const vx = m2 / across;
    const vy = m3 / across;
    const h = item.height || across;
    const corners = [
      [a * item.width, -0.22 * h],
      [b * item.width, -0.22 * h],
      [a * item.width, 0.92 * h],
      [b * item.width, 0.92 * h],
    ].map(([x, y]) =>
      viewport.convertToViewportPoint(ox + ux * x + vx * y, oy + uy * x + vy * y)
    );
    const xs = corners.map((p) => p[0] / viewport.width);
    const ys = corners.map((p) => p[1] / viewport.height);
    rects.push({
      x0: Math.max(0, Math.min(...xs)),
      y0: Math.max(0, Math.min(...ys)),
      x1: Math.min(1, Math.max(...xs)),
      y1: Math.min(1, Math.max(...ys)),
    });
  }
  return rects;
};

const snippetAround = (text: string, start: number, end: number) => {
  const from = Math.max(0, start - SNIPPET);
  const to = Math.min(text.length, end + SNIPPET);
  const clean = (s: string) => s.replace(/\s+/g, ' ');
  return {
    before: (from > 0 ? '…' : '') + clean(text.slice(from, start)).trimStart(),
    match: clean(text.slice(start, end)),
    after: clean(text.slice(end, to)).trimEnd() + (to < text.length ? '…' : ''),
  };
};

// ---- Store ----------------------------------------------------------------

export const useSearchStore = defineStore('search', () => {
  const query = ref('');
  const options = ref<Required<ISearchOptions>>({ ...DEFAULTS });
  const status = ref<'idle' | 'searching' | 'done'>('idle');
  const progress = ref<{ done: number; total: number }>({ done: 0, total: 0 });
  const results = ref<Record<SEARCH_SOURCE, ISearchHit[]>>({
    text: [],
    semantic: [],
    host: [],
  });
  const semanticStatus = ref<'idle' | 'searching' | 'done' | 'error'>('idle');
  const truncated = ref(false);
  const hostLabel = ref<string | null>(null);
  /** The list shown and stepped through (and highlighted on the pages). */
  const source = ref<SEARCH_SOURCE>('text');
  const active = ref<number | null>(null);
  /** Bumped on every selection so the page layer scrolls even to the same hit. */
  const selectSeq = ref(0);

  const hits = computed(() => results.value[source.value]);
  const activeHit = computed(() =>
    active.value === null ? null : hits.value[active.value] ?? null
  );
  const pagesWithHits = computed(() => new Set(hits.value.map((h) => h.page)).size);

  // ---- index (per document) ----
  let indexedPdf: PDFDocumentProxy | null = null;
  const pageIndex = new Map<number, Promise<PageIndex>>();

  const pdf = () => {
    const doc = toRaw(useDocumentStore().pdf) as PDFDocumentProxy | null;
    if (doc !== indexedPdf) {
      indexedPdf = doc;
      pageIndex.clear();
    }
    return doc;
  };

  const indexPage = (page: number): Promise<PageIndex> => {
    const doc = pdf();
    if (!doc) return Promise.reject(new Error('No document'));
    let entry = pageIndex.get(page);
    if (!entry) {
      entry = (async () => {
        const proxy = await doc.getPage(page);
        const content = await proxy.getTextContent({
          disableNormalization: false,
          includeMarkedContent: false,
        });
        let text = '';
        const items: IndexedItem[] = [];
        for (const raw of content.items) {
          if (!('str' in raw)) continue;
          const item = raw as TextItem;
          const start = text.length;
          text += item.str;
          items.push({
            start,
            end: text.length,
            str: item.str,
            transform: item.transform,
            width: item.width,
            height: item.height,
          });
          // pdf.js puts word spaces into the items; a line end needs one added.
          if (item.hasEOL) text += '\n';
        }
        return { page, text, items, viewport: proxy.getViewport({ scale: 1 }) };
      })();
      entry.catch(() => pageIndex.delete(page));
      pageIndex.set(page, entry);
    }
    return entry;
  };

  // ---- matching ----
  const findInPage = (
    index: PageIndex,
    needle: string,
    opts: Required<ISearchOptions>,
    sourceKind: SEARCH_SOURCE,
    idPrefix: string
  ): ISearchHit[] => {
    const hay = normalize(index.text, opts);
    const found: ISearchHit[] = [];
    let from = 0;
    while (needle && from <= hay.text.length - needle.length) {
      const at = hay.text.indexOf(needle, from);
      if (at < 0) break;
      from = at + Math.max(1, needle.length);
      if (
        opts.wholeWord &&
        (isWordChar(hay.text[at - 1]) || isWordChar(hay.text[at + needle.length]))
      )
        continue;
      const start = hay.map[at];
      const end = hay.map[at + needle.length - 1] + 1;
      found.push({
        id: `${idPrefix}${index.page}:${start}`,
        source: sourceKind,
        page: index.page,
        rects: rectsFor(index, start, end),
        ...snippetAround(index.text, start, end),
      });
    }
    return found;
  };

  /** Where `text` (a snippet from elsewhere) appears on `page`, or null. */
  const locate = async (page: number, text: string): Promise<IPageBox[] | null> => {
    const opts = { ...DEFAULTS };
    const clean = text.replace(/[…]|\.\.\./g, ' ');
    const words = normalizeQuery(clean, opts).split(' ').filter(Boolean);
    if (!words.length) return null;
    let index: PageIndex;
    try {
      index = await indexPage(page);
    } catch {
      return null;
    }
    const hay = normalize(index.text, opts);
    // Whole snippet first, then shorter leading runs of it.
    for (const take of [words.length, 12, 8, 5]) {
      if (take > words.length) continue;
      const needle = words.slice(0, take).join(' ');
      const at = hay.text.indexOf(needle);
      if (at < 0) continue;
      const start = hay.map[at];
      const end = hay.map[at + needle.length - 1] + 1;
      return rectsFor(index, start, end);
    }
    return null;
  };

  // ---- host callbacks ----
  const report = (summary: ISearchSummary) => {
    const cb = useViewerStore().onSearch;
    if (cb) useDocumentStore().callHost(() => cb(summary));
  };

  const summaryOf = (kind: SEARCH_SOURCE): ISearchSummary => {
    const list = results.value[kind];
    return {
      query: kind === 'host' ? hostLabel.value ?? '' : query.value,
      source: kind,
      total: list.length,
      pages: new Set(list.map((h) => h.page)).size,
      truncated: kind === 'text' && truncated.value,
    };
  };

  // ---- actions ----
  let runId = 0;

  /** Text search over the whole document; hits arrive page by page. */
  const run = async (q: string, opts: ISearchOptions = {}): Promise<ISearchSummary> => {
    const id = ++runId;
    query.value = q;
    options.value = { ...options.value, ...opts };
    const doc = pdf();
    const needle = normalizeQuery(q, options.value);
    results.value.text = [];
    truncated.value = false;
    // A new query is about the words: stepping goes through its matches.
    source.value = 'text';
    active.value = null;
    if (!doc || !needle) {
      status.value = 'idle';
      return summaryOf('text');
    }
    status.value = 'searching';
    const total = doc.numPages;
    progress.value = { done: 0, total };
    const perPage: ISearchHit[][] = new Array(total);
    let next = 1;
    let count = 0;
    let firstSelected = false;
    const startPage = useDocumentStore().activePage;

    const publish = () => {
      results.value.text = perPage.flat().slice(0, MAX_HITS);
    };

    const worker = async () => {
      while (next <= total && id === runId && count < MAX_HITS) {
        const page = next++;
        try {
          const index = await indexPage(page);
          if (id !== runId) return;
          const found = findInPage(index, needle, options.value, 'text', 't');
          perPage[page - 1] = found;
          count += found.length;
        } catch {
          perPage[page - 1] = [];
        }
        progress.value = { done: progress.value.done + 1, total };
        publish();
        // Jump to the first hit at or after the reader's page as soon as it exists.
        if (!firstSelected && source.value === 'text') {
          const at = results.value.text.findIndex((h) => h.page >= startPage);
          if (at >= 0) {
            firstSelected = true;
            select(at, 'text');
          }
        }
      }
    };
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));
    if (id !== runId) return summaryOf('text');
    publish();
    truncated.value = count >= MAX_HITS;
    status.value = 'done';
    if (!firstSelected && results.value.text.length && source.value === 'text')
      select(0, 'text');
    const summary = summaryOf('text');
    report(summary);
    return summary;
  };

  let semanticId = 0;
  const runSemantic = async (q: string) => {
    const fn = useViewerStore().semanticSearchFunction;
    const id = ++semanticId;
    results.value.semantic = [];
    if (!fn || !q.trim()) {
      semanticStatus.value = 'idle';
      return;
    }
    semanticStatus.value = 'searching';
    try {
      const found = await fn(q, { page: useDocumentStore().activePage });
      if (id !== semanticId) return;
      results.value.semantic = await toHits(found ?? [], 'semantic', q);
      semanticStatus.value = 'done';
      report(summaryOf('semantic'));
    } catch (error) {
      if (id !== semanticId) return;
      console.error('Semantic search failed:\n', error);
      semanticStatus.value = 'error';
    }
  };

  /** External results → hits, placed on their page by rects or by their text. */
  const toHits = async (
    found: IHostSearchResult[],
    kind: SEARCH_SOURCE,
    term: string
  ): Promise<ISearchHit[]> => {
    const sorted = found.some((r) => typeof r.score === 'number')
      ? [...found].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      : found;
    const total = useDocumentStore().totalPages;
    return Promise.all(
      sorted
        .filter((r) => r.page >= 1 && r.page <= total)
        .map(async (r, i) => {
          const rects = r.rects?.length ? r.rects : (await locate(r.page, r.text)) ?? [];
          // Bold the query inside the snippet when it occurs there.
          const lower = r.text.toLowerCase();
          const at = term ? lower.indexOf(term.toLowerCase()) : -1;
          return {
            id: r.id ?? `${kind[0]}${i}`,
            source: kind,
            page: r.page,
            rects,
            before: at >= 0 ? r.text.slice(0, at) : r.text,
            match: at >= 0 ? r.text.slice(at, at + term.length) : '',
            after: at >= 0 ? r.text.slice(at + term.length) : '',
            title: r.title,
            reason: r.reason,
            score: r.score,
          };
        })
    );
  };

  const showHostResults = async (
    found: IHostSearchResult[],
    label: string | null,
    selectIndex: number | null = 0
  ): Promise<ISearchSummary> => {
    hostLabel.value = label;
    results.value.host = await toHits(found, 'host', '');
    source.value = 'host';
    active.value = null;
    if (selectIndex !== null && results.value.host[selectIndex]) select(selectIndex, 'host');
    const summary = summaryOf('host');
    report(summary);
    return summary;
  };

  const select = (index: number, kind: SEARCH_SOURCE = source.value) => {
    const hit = results.value[kind][index];
    if (!hit) return;
    source.value = kind;
    active.value = index;
    selectSeq.value++;
    useDocumentStore().goTo(hit.page, 'search');
    const cb = useViewerStore().onSearchResultSelect;
    if (cb) {
      const isOwnId = kind === 'text' || /^[sh]\d+$/.test(hit.id);
      useDocumentStore().callHost(() =>
        cb({ source: kind, index, page: hit.page, id: isOwnId ? null : hit.id })
      );
    }
  };

  const step = (dir: 1 | -1) => {
    const list = hits.value;
    if (!list.length) return;
    if (active.value === null) {
      // Start from the reader's page, not from the top of the document.
      const page = useDocumentStore().activePage;
      const at =
        dir > 0
          ? list.findIndex((h) => h.page >= page)
          : list.length - 1 - [...list].reverse().findIndex((h) => h.page <= page);
      select(at >= 0 && at < list.length ? at : dir > 0 ? 0 : list.length - 1);
      return;
    }
    select((active.value + dir + list.length) % list.length);
  };

  const setSource = (kind: SEARCH_SOURCE) => {
    if (source.value === kind) return;
    source.value = kind;
    active.value = null;
  };

  const clear = () => {
    runId++;
    semanticId++;
    query.value = '';
    status.value = 'idle';
    semanticStatus.value = 'idle';
    results.value = { text: [], semantic: [], host: [] };
    hostLabel.value = null;
    truncated.value = false;
    active.value = null;
    source.value = 'text';
  };

  /**
   * What the page shows: every text match on `page`, plus the selected
   * related/host passage when it lives there. `active` marks the selection.
   */
  const hitsOnPage = (page: number) => {
    const shown: { hit: ISearchHit; active: boolean }[] = results.value.text
      .map((hit, index) => ({
        hit,
        active: source.value === 'text' && index === active.value,
      }))
      .filter(({ hit }) => hit.page === page && hit.rects.length);
    const selected = activeHit.value;
    if (selected && selected.source !== 'text' && selected.page === page && selected.rects.length)
      shown.push({ hit: selected, active: true });
    return shown;
  };

  return {
    query,
    options,
    status,
    progress,
    results,
    semanticStatus,
    truncated,
    hostLabel,
    source,
    active,
    selectSeq,
    hits,
    activeHit,
    pagesWithHits,
    run,
    runSemantic,
    showHostResults,
    select,
    step,
    setSource,
    clear,
    hitsOnPage,
    summaryOf,
  };
});
