import type {
  IAgentAnnotation,
  IAgentHighlight,
  IChatContext,
  IChatMessage,
  IChatStreamHandlers,
  IChatSummary,
  IExplainContext,
  IExplainResult,
  ILayer,
  IPageBookmark,
  IPageBox,
  IRegion,
  ISuggestedEntry,
} from '@/assets/utils/interfaces';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { PDFDocumentProxy, TextItem } from 'pdfjs-dist/types/src/display/api';
import samplePdf from '../SampleTOC.pdf';

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
  selectedText: string,
  context?: IExplainContext
): Promise<IExplainResult> => {
  await delay(500);
  if (context?.regionId) {
    return {
      simple: `Tento objekt (${context.regionId}, strana ${context.page}) zhŕňa myšlienku okolitého textu vizuálne: „${selectedText}“ (mock dáta).`,
      examples: [
        { label: 'Čo ukazuje', description: 'Hlavný vzťah medzi veličinami, ktorý text opisuje slovami.' },
        { label: 'Ako to čítať', description: 'Začni popiskom, potom osami / hlavičkou a až potom hodnotami.' },
      ],
    };
  }
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

// --- IP-018 intelligent viewer mocks ----------------------------------------

// The sample document, opened once so the mocks can place agent highlights on
// real text lines instead of guessing coordinates.
let sampleDoc: Promise<PDFDocumentProxy> | null = null;
const getSampleDoc = () => (sampleDoc ??= getDocument({ url: samplePdf }).promise);

interface ISampleLine {
  page: number;
  text: string;
  box: IPageBox;
}

const linesByPage = new Map<number, Promise<ISampleLine[]>>();

// Groups text items into lines and converts them to page fractions with a
// top-left origin — the same convention the catalog stores (IP-018 Coordinates).
const getLines = (page: number) => {
  if (!linesByPage.has(page)) {
    linesByPage.set(
      page,
      (async () => {
        const doc = await getSampleDoc();
        if (page > doc.numPages) return [];
        const pdfPage = await doc.getPage(page);
        const [vx, vy, vx1, vy1] = pdfPage.view;
        const width = vx1 - vx;
        const height = vy1 - vy;
        const content = await pdfPage.getTextContent();

        const lines = new Map<number, { text: string[]; x0: number; x1: number; top: number; bottom: number }>();
        for (const item of content.items as TextItem[]) {
          if (!item.str?.trim()) continue;
          const x = item.transform[4] - vx;
          const baseline = item.transform[5] - vy;
          const size = item.height || Math.abs(item.transform[3]);
          const key = Math.round(baseline);
          const line = lines.get(key) ?? { text: [], x0: x, x1: x, top: baseline + size, bottom: baseline - size * 0.25 };
          line.text.push(item.str);
          line.x0 = Math.min(line.x0, x);
          line.x1 = Math.max(line.x1, x + item.width);
          line.top = Math.max(line.top, baseline + size);
          lines.set(key, line);
        }

        return [...lines.entries()]
          .sort(([a], [b]) => b - a) // reading order: top of the page first
          .map(([, l]) => ({
            page,
            text: l.text.join(' ').replace(/\s+/g, ' ').trim(),
            box: {
              x0: l.x0 / width,
              y0: 1 - l.top / height,
              x1: l.x1 / width,
              y1: 1 - l.bottom / height,
            },
          }))
          .filter((l) => l.text.length > 20);
      })()
    );
  }
  return linesByPage.get(page)!;
};

let highlightCounter = 0;

// Two consecutive lines make one "sentence" highlight with two quads.
const toHighlight = (lines: ISampleLine[], index: number, seq: number): IAgentHighlight => {
  const pair = lines.slice(index, index + 2);
  return {
    id: `hl-${++highlightCounter}`,
    seq,
    page: pair[0].page,
    quads: pair.map((l) => l.box),
    text: pair.map((l) => l.text).join(' '),
    note: null,
  };
};

const buildAnnotation = async (
  prompt: string,
  pages: number[],
  pick: (line: ISampleLine, index: number) => boolean
): Promise<IAgentAnnotation> => {
  const highlights: IAgentHighlight[] = [];
  for (const page of pages) {
    const lines = await getLines(page);
    for (let i = 0; i < lines.length - 1 && highlights.length < 8; i++) {
      if (pick(lines[i], i)) {
        highlights.push(toHighlight(lines, i, highlights.length + 1));
        i++; // the next line is already part of this highlight
      }
    }
  }
  return {
    id: `agent-${Date.now()}-${Math.round(Math.random() * 1000)}`,
    title: prompt.length > 40 ? `${prompt.slice(0, 40)}…` : prompt,
    prompt,
    summary: highlights.length
      ? `Prejdi si ${highlights.length} označených viet v poradí — tvoria krátku cestu knihou k téme „${prompt}“ (mock).`
      : `Na tému „${prompt}“ sa v knihe nenašla žiadna presná pasáž (mock).`,
    status: 'done',
    unresolvedCount: highlights.length ? 1 : 0,
    highlights,
  };
};

let agentAnnotationsStore: IAgentAnnotation[] | null = null;

export const getAgentAnnotationsFunc = async (): Promise<IAgentAnnotation[]> => {
  await delay(400);
  if (!agentAnnotationsStore) {
    // Pages 8–10 of the sample are running prose (1–7 are the title page and TOC).
    const seeded = await buildAnnotation('Základné pojmy kapitoly', [8, 9, 10], (_, i) => i % 6 === 2);
    if (seeded.highlights[0]) seeded.highlights[0].note = 'Definícia, na ktorej stojí zvyšok kapitoly.';
    agentAnnotationsStore = [seeded];
  }
  return agentAnnotationsStore.map((a) => ({ ...a, highlights: [...a.highlights] }));
};

export const requestAgentAnnotationFunc = async (prompt: string): Promise<IAgentAnnotation> => {
  await delay(1800);
  const doc = await getSampleDoc();
  const pages = Array.from({ length: Math.min(doc.numPages, 20) }, (_, i) => i + 1).filter((p) => p >= 8);
  const words = prompt
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 4);

  // Prefer lines that mention the prompt; otherwise fall back to a sparse sample.
  let annotation = await buildAnnotation(prompt, pages, (l) => words.some((w) => l.text.toLowerCase().includes(w)));
  if (!annotation.highlights.length) {
    annotation = await buildAnnotation(prompt, pages, (_, i) => i % 9 === 4);
  }
  agentAnnotationsStore = [annotation, ...(agentAnnotationsStore ?? [])];
  return annotation;
};

export const deleteAgentHighlightFunc = async (annotationId: string, highlightId: string) => {
  await delay(300);
  const annotation = agentAnnotationsStore?.find((a) => a.id === annotationId);
  if (annotation) annotation.highlights = annotation.highlights.filter((h) => h.id !== highlightId);
};

export const deleteAgentAnnotationFunc = async (annotationId: string) => {
  await delay(300);
  agentAnnotationsStore = (agentAnnotationsStore ?? []).filter((a) => a.id !== annotationId);
};

// Regions: fixed boxes per page (figure / table / equation in turn). Real
// positions come from the extraction services; these only exercise the UI.
export const getRegionsFunc = async (page: number): Promise<IRegion[]> => {
  await delay(250);
  const regions: IRegion[] = [];
  if (page % 3 === 1) {
    regions.push({
      id: `fig-${page}-1`,
      kind: 'figure',
      page,
      bbox: { x0: 0.14, y0: 0.2, x1: 0.86, y1: 0.46 },
      caption: `Obr. ${page}.1: Schéma spracovania dát od vstupu po výsledok (mock).`,
      category: 'diagram',
    });
  }
  if (page % 3 === 2) {
    regions.push({
      id: `tab-${page}-1`,
      kind: 'table',
      page,
      bbox: { x0: 0.1, y0: 0.52, x1: 0.9, y1: 0.78 },
      caption: `Tab. ${page}.1: Porovnanie metód (mock).`,
      markdown:
        '| Metóda | Presnosť | Čas |\n|---|---|---|\n| Lineárna | 0,81 | 2 s |\n| Stromy | 0,88 | 9 s |\n| Sieť | 0,93 | 41 s |',
    });
  }
  regions.push({
    id: `eq-${page}-1`,
    kind: 'equation',
    page,
    bbox: { x0: 0.3, y0: 0.82, x1: 0.7, y1: 0.87 },
    latex: 'E = \\sum_{i=1}^{n} (y_i - \\hat{y}_i)^2',
  });
  return regions;
};

// Chat: streams a canned answer word by word, like the assistant SSE.
const streamText = async (text: string, handlers: IChatStreamHandlers) => {
  for (const part of text.split(/(\s+)/)) {
    handlers.onChunk(part);
    if (part.trim()) await delay(25);
  }
};

const describeContext = (ctx: IChatContext) => {
  switch (ctx.kind) {
    case 'selection':
      return `Vybraná pasáž „${ctx.text.slice(0, 80)}“ zo strany [[page:${ctx.page}]] hovorí o jednej myšlienke — skúsim ju rozložiť na menšie kroky.`;
    case 'explain':
      return `Nadviažem na vysvetlenie: *${ctx.explanation.slice(0, 120)}* Ďalší krok je pozrieť sa, kde sa to v knihe používa, napríklad na strane [[page:${ctx.page + 1}]].`;
    case 'region': {
      const detail =
        ctx.region.kind === 'table'
          ? 'porovnáva hodnoty v riadkoch — najdôležitejší je posledný stĺpec.'
          : ctx.region.kind === 'equation'
            ? `je rovnica \`${ctx.region.latex}\`, ktorá sčítava chyby cez všetky prvky.`
            : 'ukazuje postup zľava doprava; každý blok zodpovedá jednému odseku textu.';
      return `Objekt [[region:${ctx.region.id}]] na strane [[page:${ctx.region.page}]] ${detail}`;
    }
    case 'highlight':
      return `Zvýraznená veta #${ctx.highlight.seq} zo strany [[page:${ctx.highlight.page}]] je dôležitá, lebo zavádza pojem, ktorý sa ďalej opakuje.`;
  }
};

// Chat history: an in-memory store of conversations, seeded with a few old ones
// (one of them about another book, which the viewer shows read-only).
interface IMockChat {
  summary: IChatSummary;
  messages: IChatMessage[];
}

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();
let mockMessageId = 0;
const mockMessage = (role: IChatMessage['role'], text: string, extra: Partial<IChatMessage> = {}): IChatMessage => ({
  id: `mock-msg-${++mockMessageId}`,
  role,
  text,
  status: 'done',
  ...extra,
});

const mockChats = new Map<string, IMockChat>([
  [
    'chat-1',
    {
      summary: { id: 'chat-1', title: 'Čo je relačný model?', updatedAt: daysAgo(0.2), messageCount: 2, aboutThisBook: true },
      messages: [
        mockMessage('user', 'Čo je relačný model?'),
        mockMessage(
          'assistant',
          'Relačný model ukladá dáta do **tabuliek** (relácií), ktoré sa prepájajú cez kľúče. Kniha ho zavádza na strane [[page:9]] a podrobnejšie v druhej kapitole na strane [[page:12]].'
        ),
      ],
    },
  ],
  [
    'chat-2',
    {
      summary: { id: 'chat-2', title: 'Rozdiel medzi 2- a 3-úrovňovou architektúrou', updatedAt: daysAgo(3), messageCount: 4, aboutThisBook: true },
      messages: [
        mockMessage('user', 'Aký je rozdiel medzi 2- a 3-úrovňovou architektúrou?'),
        mockMessage(
          'assistant',
          'V 2-úrovňovej architektúre klient komunikuje priamo s databázou. 3-úrovňová pridáva **aplikačný server** medzi nich — pozri obrázok na strane [[page:10]].'
        ),
        mockMessage('user', 'Odporuč mi k tomu knihy.'),
        mockMessage('assistant', 'Tu sú knihy, ktoré na to nadväzujú:', { entries: exampleEntries.slice(0, 2) }),
      ],
    },
  ],
  [
    'chat-3',
    {
      summary: { id: 'chat-3', title: 'Úvod do strojového učenia', updatedAt: daysAgo(12), messageCount: 2, aboutThisBook: false },
      messages: [
        mockMessage('user', 'Kde začať so strojovým učením?'),
        mockMessage('assistant', 'Začni lineárnou regresiou a až potom prejdi na stromy a neurónové siete (mock, iná kniha).'),
      ],
    },
  ],
]);

let mockChatCounter = 3;

export const getChatsFunc = async (): Promise<IChatSummary[]> => {
  await delay(400);
  return [...mockChats.values()]
    .map((c) => ({ ...c.summary }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const getChatFunc = async (chatId: string): Promise<IChatMessage[]> => {
  await delay(350);
  const chat = mockChats.get(chatId);
  if (!chat) throw new Error('chat not found');
  return chat.messages.map((m) => ({ ...m }));
};

export const deleteChatFunc = async (chatId: string) => {
  await delay(300);
  mockChats.delete(chatId);
};

export const exampleChatSendFunction = async (
  message: string,
  contexts: IChatContext[],
  handlers: IChatStreamHandlers,
  meta: { page: number; chatId: string | null }
): Promise<{ chatId: string }> => {
  // Continue the given chat, or start one titled after the first message.
  let chatId = meta.chatId;
  if (!chatId || !mockChats.has(chatId)) {
    chatId = `chat-${++mockChatCounter}`;
    mockChats.set(chatId, {
      summary: {
        id: chatId,
        title: message.length > 60 ? `${message.slice(0, 60)}…` : message,
        updatedAt: daysAgo(0),
        messageCount: 0,
        aboutThisBook: true,
      },
      messages: [],
    });
  }
  const chat = mockChats.get(chatId)!;

  // Record what the reader saw, so reopening the chat from history shows it.
  let answer = '';
  let entries: ISuggestedEntry[] | undefined;
  const recording: IChatStreamHandlers = {
    onChunk: (text) => {
      answer += text;
      handlers.onChunk(text);
    },
    onMessage: (text) => {
      answer = text;
      handlers.onMessage(text);
    },
    onEntries: (list) => {
      entries = list;
      handlers.onEntries(list);
    },
    onError: handlers.onError,
  };

  await answerChat(message, contexts, recording, meta);

  chat.messages.push(mockMessage('user', message, { contexts }), mockMessage('assistant', answer, { entries }));
  chat.summary.updatedAt = daysAgo(0);
  chat.summary.messageCount = chat.messages.length;
  return { chatId };
};

const answerChat = async (
  message: string,
  contexts: IChatContext[],
  handlers: IChatStreamHandlers,
  meta: { page: number }
) => {
  await delay(500);
  const wantsBooks = /knih|book|odporu|recommend|podobn|similar/i.test(message);

  const paragraphs = [
    ...contexts.map(describeContext),
    contexts.length
      ? `K otázke „${message}“: **v skratke** áno — kniha to rozoberá podrobnejšie na stranách [[page:${meta.page}]] a [[page:${meta.page + 2}]].`
      : `K otázke „${message}“ v tejto knihe:\n\n- hlavná myšlienka je na strane [[page:${meta.page}]],\n- príklad nájdeš na strane [[page:${meta.page + 1}]],\n- *mock odpoveď*, backend zatiaľ nebeží.`,
  ];
  if (wantsBooks) paragraphs.push('Tu je zopár kníh, ktoré na to nadväzujú:');

  await streamText(paragraphs.join('\n\n'), handlers);
  if (wantsBooks) handlers.onEntries(exampleEntries.slice(0, 3));
};
