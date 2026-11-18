// The host's handle on a mounted viewer (Facade): commands in, state and
// events out. Built inside the viewer component so its reactive snapshot is
// disposed with it. See IViewerController for the contract.
import { computed, toRaw, watch } from 'vue';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import type { ISelectionInfo, IViewerController, IViewerState, VIEWER_PANEL } from '@/assets/utils/interfaces';
import { SIDEBAR_STATE } from '@/assets/utils/enums';
import { useAssistantStore, useDocumentStore, useSearchStore, useViewerStore } from '@/stores';
import { resolveDestination, toOutline } from '@/core/document/outline';
import type { useDocumentLoader } from './useDocumentLoader';
import type { useTheme, Theme } from './useTheme';
import type { TextSelection } from './useTextSelection';

const PANELS: Record<VIEWER_PANEL, SIDEBAR_STATE> = {
  search: SIDEBAR_STATE.SEARCH,
  share: SIDEBAR_STATE.SHARE,
  info: SIDEBAR_STATE.INFO,
  print: SIDEBAR_STATE.PRINT,
  toc: SIDEBAR_STATE.TOC,
  pages: SIDEBAR_STATE.PAGES,
  highlights: SIDEBAR_STATE.HIGHLIGHTS,
};
const CARDS = new Set<VIEWER_PANEL>(['share', 'info', 'print']);

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

export const useViewerController = (deps: {
  loader: ReturnType<typeof useDocumentLoader>;
  theme: ReturnType<typeof useTheme>;
  selection: TextSelection;
  setLang: (lang: string) => void;
}): IViewerController => {
  const { loader, theme, selection, setLang } = deps;
  const docStore = useDocumentStore();
  const viewerStore = useViewerStore();
  const assistantStore = useAssistantStore();
  const searchStore = useSearchStore();

  // A snapshot that changes identity only when its content does (Vue's
  // computed caches it), frozen so a host cannot mutate viewer state.
  const snapshot = computed<IViewerState>(() =>
    deepFreeze({
      page: docStore.activePage,
      totalPages: docStore.totalPages,
      pageLabel: docStore.pageLabel(docStore.activePage),
      canGoBack: docStore.backStack.length > 0,
      canGoForward: docStore.forwardStack.length > 0,
      scale: docStore.scale,
      theme: (theme.isDark.value ? 'dark' : 'light') as Theme,
      lang: viewerStore.lang,
      status: loader.failed.value ? 'failed' : docStore.openStatus,
      progress: docStore.downloadProgress ? { ...docStore.downloadProgress } : null,
      search: {
        query: searchStore.query,
        source: searchStore.source,
        total: searchStore.hits.length,
        active: searchStore.active,
      },
    })
  );

  const subscribers = new Set<() => void>();
  watch(snapshot, () => {
    for (const listener of [...subscribers]) {
      try {
        listener();
      } catch (error) {
        console.error('Viewer state subscriber failed:\n', error);
      }
    }
  });

  // Page text for AI grounding, cached per document.
  let textCache = new Map<number, Promise<string>>();
  watch(
    () => docStore.pdf,
    () => (textCache = new Map())
  );
  const getPageText = (page: number): Promise<string> => {
    const pdf = toRaw(docStore.pdf) as PDFDocumentProxy | null;
    if (!pdf || page < 1 || page > pdf.numPages) return Promise.resolve('');
    let text = textCache.get(page);
    if (!text) {
      text = pdf
        .getPage(page)
        .then((p) => p.getTextContent())
        .then(({ items }) =>
          items
            .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : '') : ''))
            .join('')
            .trim()
        )
        .catch(() => {
          textCache.delete(page);
          return '';
        });
      textCache.set(page, text);
    }
    return text;
  };

  const goTo = (page: number) => {
    if (docStore.pdf) docStore.goTo(page, 'host');
    else loader.setOpenAt({ initialPage: page });
  };

  return {
    open: (next, at = {}) => loader.open(next, at),
    retry: () => loader.retry(),
    goToPage: goTo,
    goToLabel: async (label) => {
      const page = docStore.pdf ? docStore.pageForLabel(label) : null;
      if (page) docStore.goTo(page, 'host');
      return page;
    },
    goToDestination: async (name) => {
      const pdf = toRaw(docStore.pdf) as PDFDocumentProxy | null;
      const page = pdf ? await resolveDestination(pdf, name) : null;
      if (page) docStore.goTo(page, 'host');
      return page;
    },
    nextPage: () => docStore.nextPage(),
    previousPage: () => docStore.previousPage(),
    back: () => docStore.goBack(),
    forward: () => docStore.goForward(),
    getOutline: async () => toOutline(await loader.getOutline()),
    focus: (target) => {
      if (!docStore.pdf) {
        loader.setOpenAt({ initialFocus: target });
        return;
      }
      assistantStore.focusOn({ ...target, page: target.page ?? docStore.activePage }, 'host');
    },
    setScale: (scale) => docStore.setScale(scale),
    setTheme: (value) => theme.setHostTheme(value),
    setLang: (lang) => setLang(lang),
    openPanel: (panel) => {
      if (panel && CARDS.has(panel)) {
        docStore.actionPopover = panel as 'share' | 'info' | 'print';
        return;
      }
      docStore.actionPopover = null;
      docStore.sidebarState = panel ? PANELS[panel] : SIDEBAR_STATE.NULL;
    },
    search: async (query, { openPanel = true, ...options } = {}) => {
      if (openPanel) docStore.sidebarState = SIDEBAR_STATE.SEARCH;
      // Related passages arrive on their own; the promise is the text search.
      if (viewerStore.semanticSearchFunction && query.trim().length >= 3) void searchStore.runSemantic(query);
      return searchStore.run(query, options);
    },
    searchNext: () => searchStore.step(1),
    searchPrevious: () => searchStore.step(-1),
    clearSearch: () => searchStore.clear(),
    showResults: async (results, { label = null, select = 0, openPanel = true } = {}) => {
      if (openPanel) docStore.sidebarState = SIDEBAR_STATE.SEARCH;
      return searchStore.showHostResults(results, label, select);
    },
    getState: () => snapshot.value,
    subscribe: (listener) => {
      subscribers.add(listener);
      return () => subscribers.delete(listener);
    },
    on: (event, listener) => viewerStore.events.on(event, listener),
    setOptions: (options) => {
      viewerStore.bindOptions(options, { partial: true });
      if ('lang' in options && options.lang) setLang(options.lang);
      if ('theme' in options) theme.setHostTheme(options.theme ?? null);
    },
    getSelection: (): ISelectionInfo | null => {
      const state = selection.state.value;
      return state.kind === 'selected' ? state.selection : null;
    },
    clearSelection: () => selection.clear(),
    getPageText,
  };
};
