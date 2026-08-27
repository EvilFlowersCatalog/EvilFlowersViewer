import type {
  IExplainResult,
  ILayer,
  IPageBookmark,
  ISuggestedEntry,
} from '@/assets/utils/interfaces';

const delay = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Store layers per page, keyed by groupId-pageNumber
const layerStore = new Map<string, ILayer>();
let layerIdCounter = 0;

export const saveLayerFunc = async (
  svg: string,
  groupId: string,
  page: number
): Promise<ILayer> => {
  await delay(2000);

  const layerId = `layer-${++layerIdCounter}`;
  const layer: ILayer = { id: layerId, svg };
  const key = `${groupId}-${page}`;
  
  layerStore.set(key, layer);
  
  return layer;
};

export const updateLayerFunc = async (
  id: string,
  svg: string,
  groupId: string,
  page: number
) => {
  await delay(2000);

  const key = `${groupId}-${page}`;
  const layer: ILayer = { id, svg };
  
  layerStore.set(key, layer);
};

export const getLayerFunc = async (
  page: number,
  groupId: string
): Promise<{ id: string; svg: string } | null> => {
  await delay(2000);

  const key = `${groupId}-${page}`;
  const layer = layerStore.get(key);
  
  return layer || null;
};
export const saveGroupFunc = async (name: string) => {
  await delay(2000);

  console.log(name, 'saved');
  return { response: { id: '1' } };
};
export const getGroupsFunc = async (): Promise<
  { id: string; name: string }[]
> => {
  await delay(2000);

  return [{ id: '1', name: 'jeden' }];
};

export const exampleShareFunction = async (
  pages: string | null,
  expaireDate: string
) => {
  // create submit
  const params = {
    acquisition_id: 'will be in my app',
    range: pages ?? null,
    type: 'shared',
    expires_at: expaireDate, // ISO
  };

  await delay(2000);
  return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley';
};

export const examplePrintFunction = async (pages: string | null) => {
  // create submit
  const params = {
    acquisition_id: 'will be in elvira app',
    range: pages,
  };

  await delay(2000);
  return 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley';
};

export const homeFunction = () => {
  console.log('home');
};
export const closeFunction = () => {
  console.log('close');
};

// stub
const exampleEntries: ISuggestedEntry[] = [
  {
    id: '1',
    catalog_id: 'cat-1',
    title: 'Introduction to Data Science',
    authors: [{ name: 'Giang', surname: 'Nguyen' }],
    thumbnail: 'https://placehold.co/200x280?text=Data+Science',
  },
  {
    id: '2',
    catalog_id: 'cat-1',
    title: 'Umelá inteligencia',
    authors: [{ name: 'Pavol', surname: 'Návrat' }],
    thumbnail: 'https://placehold.co/200x280?text=AI',
    shelf_record_id: 'shelf-2',
  },
  {
    id: '3',
    catalog_id: 'cat-1',
    title: 'Programovanie: Úvod do programovania',
    authors: [{ name: 'Michal', surname: 'Kováč' }],
    thumbnail: 'https://placehold.co/200x280?text=Programming',
  },
  {
    id: '4',
    catalog_id: 'cat-1',
    title: 'Quantum Computing for Everyone',
    authors: [{ name: 'Chris', surname: 'Bernhardt' }],
    thumbnail: 'https://placehold.co/200x280?text=Quantum',
  },
];

export const exampleOpenEntryDetailFunction = (entry: ISuggestedEntry) => {
  console.log('open entry detail', entry.id);
};

export const exampleBookmarkToggleFunction = async (entry: ISuggestedEntry) => {
  await delay(400);
  const isOnShelf = entry.shelf_record_id == null;
  entry.shelf_record_id = isOnShelf ? 'shelf-mock' : null;
  return { isOnShelf, shelfRecordId: entry.shelf_record_id };
};

export const exampleSuggestionsFunction = async (): Promise<ISuggestedEntry[]> => {
  await delay(500);
  return exampleEntries;
};

export const exampleExplainFunction = async (
  selectedText: string
): Promise<IExplainResult> => {
  await delay(500);
  return {
    simple: `Jednoducho povedané: „${selectedText}“ je pasáž vysvetlená zrozumiteľným jazykom (mock dáta, backend zatiaľ neexistuje).`,
    examples: [
      { label: 'Strojový preklad', description: `Príklad pre „${selectedText}“ v kontexte prekladu.` },
      { label: 'Generovanie textu', description: `Príklad pre „${selectedText}“ v kontexte generovania.` },
      { label: 'Analýza časových radov', description: `Príklad pre „${selectedText}“ v kontexte analýzy.` },
    ],
  };
};

export const exampleCitation: string = `@article {exmaple-citation,
  abstract = {Tento dokument je teostovací s testovaciou citáciou na skúšku, čiže pohodička, neviem čo ďaľej napísať},
  author = {FIIT STU TvojTatkoRecords},
  doi = {69.696969/testujemeSpolu},
  journal = {Napal rytmausa},
  keywords = {citation},
  number = {6},
  title = {Toto je testovacia citácia testovaného pdfka},
  volume = {0},
  year = {1950}
}`;


//stub for annoatation layer
const BOOKMARKS_KEY = 'efv-dev-page-bookmarks';

const readBookmarks = (): IPageBookmark[] => {
  try {
    const raw = localStorage.getItem(BOOKMARKS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeBookmarks = (bookmarks: IPageBookmark[]) => {
  try {
    localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
  } catch {
    // Private-mode / quota failures are non-fatal here — the viewer keeps its
    // own in-memory state either way.
  }
};

export const getPageBookmarksFunc = async (): Promise<IPageBookmark[]> => {
  await delay(300);
  return readBookmarks();
};

export const addPageBookmarkFunc = async (
  page: number
): Promise<IPageBookmark> => {
  await delay(300);

  const bookmarks = readBookmarks();
  const existing = bookmarks.find((b) => b.page === page);
  if (existing) return existing;

  const bookmark: IPageBookmark = { page, id: `bookmark-${page}-${Date.now()}` };
  writeBookmarks([...bookmarks, bookmark]);
  return bookmark;
};

export const removePageBookmarkFunc = async (
  page: number,
  id?: string | null
) => {
  await delay(300);

  // Prefer the record id when the caller has one, fall back to the page.
  writeBookmarks(
    readBookmarks().filter((b) => (id ? b.id !== id : b.page !== page))
  );
};
