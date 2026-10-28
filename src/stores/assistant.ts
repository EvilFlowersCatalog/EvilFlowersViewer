import { ref } from 'vue';
import { defineStore } from 'pinia';
import type {
  IAgentAnnotation,
  IAgentHighlight,
  IChatContext,
  IChatMessage,
  IChatSummary,
  IRegion,
} from '@/assets/utils/interfaces';
import { SIDEBAR_STATE } from '@/assets/utils/enums';
import { useDocumentStore } from './document';
import { useViewerStore } from './viewer';

/** An open explain popup. `anchor` is the page body the popup first spawns next to. */
export interface IExplainRequest {
  id: number;
  text: string;
  page: number;
  regionId?: string;
  anchor: DOMRect | null;
}

let sequence = 0;
const nextId = (prefix: string) => `${prefix}-${++sequence}`;

/** Two contexts are the same attachment when they point at the same thing. */
const contextKey = (ctx: IChatContext) => {
  switch (ctx.kind) {
    case 'selection':
      return `selection:${ctx.page}:${ctx.text}`;
    case 'explain':
      return `explain:${ctx.page}:${ctx.regionId ?? ctx.text}`;
    case 'region':
      return `region:${ctx.region.id}`;
    case 'highlight':
      return `highlight:${ctx.highlight.id}`;
  }
};

/**
 * State of the IP-018 "intelligent viewer" features: extracted regions, the
 * explain popup, the reading chat and agent annotations. Host calls go through
 * the packages in the viewer store; everything here is per viewer instance.
 */
export const useAssistantStore = defineStore('assistant', () => {
  // --- Regions ---------------------------------------------------------------
  const regionsByPage = ref<Map<number, IRegion[]>>(new Map());
  const regionsRequested = new Set<number>();

  const loadRegions = async (page: number) => {
    const pkg = useViewerStore().regionPackage;
    if (!pkg || regionsRequested.has(page)) return;
    regionsRequested.add(page);
    try {
      regionsByPage.value.set(page, await pkg.getRegionsFunc(page));
    } catch (error) {
      regionsRequested.delete(page); // let a later visit retry
      console.error('Failed to load regions:\n', error);
    }
  };

  const findRegion = (id: string): IRegion | null => {
    for (const regions of regionsByPage.value.values()) {
      const found = regions.find((r) => r.id === id);
      if (found) return found;
    }
    return null;
  };

  // Set from a chat citation so the page layer flashes the region once rendered.
  const focusedRegionId = ref<string | null>(null);

  const goToRegion = (region: IRegion) => {
    useDocumentStore().activePage = region.page;
    focusedRegionId.value = region.id;
  };

  // --- Explain popup ---------------------------------------------------------
  const explainRequest = ref<IExplainRequest | null>(null);
  // Where the reader last dragged the popup; the next one opens there.
  const explainPosition = ref<{ x: number; y: number } | null>(null);

  const openExplain = (request: Omit<IExplainRequest, 'id'>) => {
    explainRequest.value = { ...request, id: ++sequence };
  };
  const closeExplain = () => {
    explainRequest.value = null;
  };

  // --- Chat ------------------------------------------------------------------
  const isChatOpen = ref(false);
  const messages = ref<IChatMessage[]>([]);
  const pendingContexts = ref<IChatContext[]>([]);
  const isGenerating = ref(false);
  // The conversation being shown; null until the first message creates one.
  const currentChatId = ref<string | null>(null);
  // Past chats about other publications can be read here but not continued.
  const isCurrentChatReadOnly = ref(false);
  // Bumped whenever something asks the chat input to take focus.
  const focusInputTick = ref(0);

  const openChat = () => {
    isChatOpen.value = true;
    focusInputTick.value++;
  };

  const addContext = (ctx: IChatContext) => {
    // Attaching something from this book while reading another book's chat starts a new one.
    if (isCurrentChatReadOnly.value) {
      messages.value = [];
      currentChatId.value = null;
      isCurrentChatReadOnly.value = false;
    }
    chatView.value = 'chat';
    const key = contextKey(ctx);
    if (!pendingContexts.value.some((c) => contextKey(c) === key)) {
      pendingContexts.value.push(ctx);
    }
    openChat();
  };

  const removeContext = (index: number) => {
    pendingContexts.value.splice(index, 1);
  };

  const sendMessage = async (text: string) => {
    const pkg = useViewerStore().chatPackage;
    const message = text.trim();
    if (!pkg || isGenerating.value || isCurrentChatReadOnly.value || !message) return;

    const contexts = pendingContexts.value;
    pendingContexts.value = [];
    messages.value.push({ id: nextId('user'), role: 'user', text: message, contexts });
    messages.value.push({ id: nextId('answer'), role: 'assistant', text: '', status: 'streaming' });
    // The reactive proxy of the message just pushed, so the handlers update the UI.
    const answer = messages.value[messages.value.length - 1];

    isGenerating.value = true;
    try {
      const sent = await pkg.sendMessageFunc(
        message,
        contexts,
        {
          onChunk: (chunk) => (answer.text += chunk),
          onMessage: (full) => (answer.text = full),
          onEntries: (entries) => (answer.entries = entries),
          onPages: (pages) => (answer.pages = pages),
          onError: (detail) => {
            answer.status = 'error';
            answer.text = detail;
          },
        },
        { page: useDocumentStore().activePage, chatId: currentChatId.value }
      );
      if (sent?.chatId) currentChatId.value = sent.chatId;
      if (answer.status === 'streaming') answer.status = 'done';
      chatsStale = true;
    } catch (error) {
      console.error('Chat message failed:\n', error);
      answer.status = 'error';
      answer.text = '';
    } finally {
      isGenerating.value = false;
    }
  };

  const resetChat = () => {
    if (isGenerating.value) return;
    messages.value = [];
    pendingContexts.value = [];
    currentChatId.value = null;
    isCurrentChatReadOnly.value = false;
    chatView.value = 'chat';
    useViewerStore().chatPackage?.resetFunc?.();
    openChat();
  };

  // --- Chat history ------------------------------------------------------------
  const chatView = ref<'chat' | 'history'>('chat');
  const chats = ref<IChatSummary[]>([]);
  const chatsLoading = ref(false);
  const chatsFailed = ref(false);
  const openingChatId = ref<string | null>(null);
  // Set after a message is sent, so the list is refetched next time it opens.
  let chatsStale = true;

  const hasHistory = () => {
    const pkg = useViewerStore().chatPackage;
    return !!(pkg?.getChatsFunc && pkg?.getChatFunc);
  };

  const loadChats = async (force = false) => {
    const pkg = useViewerStore().chatPackage;
    if (!pkg?.getChatsFunc || (!force && !chatsStale && chats.value.length)) return;
    chatsLoading.value = true;
    chatsFailed.value = false;
    try {
      chats.value = await pkg.getChatsFunc();
      chatsStale = false;
    } catch (error) {
      console.error('Failed to load chat history:\n', error);
      chatsFailed.value = true;
    } finally {
      chatsLoading.value = false;
    }
  };

  const toggleHistory = () => {
    chatView.value = chatView.value === 'history' ? 'chat' : 'history';
    if (chatView.value === 'history') loadChats();
  };

  const openPastChat = async (chat: IChatSummary) => {
    const pkg = useViewerStore().chatPackage;
    if (!pkg?.getChatFunc || isGenerating.value || openingChatId.value) return;
    if (chat.id === currentChatId.value) {
      chatView.value = 'chat';
      return;
    }
    openingChatId.value = chat.id;
    try {
      messages.value = (await pkg.getChatFunc(chat.id)).map((m) => ({ ...m, status: m.status ?? 'done' }));
      currentChatId.value = chat.id;
      isCurrentChatReadOnly.value = !chat.aboutThisBook;
      pendingContexts.value = [];
      chatView.value = 'chat';
    } catch (error) {
      console.error('Failed to open chat:\n', error);
    } finally {
      openingChatId.value = null;
    }
  };

  const deleteChat = async (chatId: string) => {
    const pkg = useViewerStore().chatPackage;
    if (!pkg?.deleteChatFunc) return;
    const index = chats.value.findIndex((c) => c.id === chatId);
    if (index === -1) return;

    const [removed] = chats.value.splice(index, 1);
    try {
      await pkg.deleteChatFunc(chatId);
      if (currentChatId.value === chatId) {
        messages.value = [];
        currentChatId.value = null;
        isCurrentChatReadOnly.value = false;
      }
    } catch (error) {
      console.error('Failed to delete chat:\n', error);
      chats.value.splice(index, 0, removed);
    }
  };

  // --- Agent annotations -----------------------------------------------------
  const agentAnnotations = ref<IAgentAnnotation[]>([]);
  const showAgentHighlights = ref(true);
  const hiddenAnnotationIds = ref<Set<string>>(new Set());
  const activeHighlightId = ref<string | null>(null);

  const loadAgentAnnotations = async () => {
    agentAnnotations.value = [];
    const pkg = useViewerStore().agentAnnotationPackage;
    if (!pkg) return;
    try {
      agentAnnotations.value = await pkg.getAnnotationsFunc();
    } catch (error) {
      console.error('Failed to load agent annotations:\n', error);
    }
  };

  const isAnnotationVisible = (id: string) =>
    showAgentHighlights.value && !hiddenAnnotationIds.value.has(id);

  const toggleAnnotation = (id: string) => {
    if (hiddenAnnotationIds.value.has(id)) hiddenAnnotationIds.value.delete(id);
    else hiddenAnnotationIds.value.add(id);
  };

  // Stable per annotation, so hiding one never recolours the others.
  const annotationColorIndex = (id: string) =>
    Math.max(0, agentAnnotations.value.findIndex((a) => a.id === id));

  /** Visible highlights on `page`, each with the annotation it belongs to. */
  const highlightsOnPage = (page: number) =>
    agentAnnotations.value
      .filter((a) => isAnnotationVisible(a.id))
      .flatMap((a) =>
        a.highlights
          .filter((h) => h.page === page)
          .map((h) => ({ annotation: a, highlight: h, colorIndex: annotationColorIndex(a.id) }))
      );

  const findHighlight = (highlightId: string) => {
    for (const annotation of agentAnnotations.value) {
      const highlight = annotation.highlights.find((h) => h.id === highlightId);
      if (highlight) return { annotation, highlight };
    }
    return null;
  };

  const goToHighlight = (annotationId: string, highlight: IAgentHighlight) => {
    showAgentHighlights.value = true;
    hiddenAnnotationIds.value.delete(annotationId);
    useDocumentStore().activePage = highlight.page;
    activeHighlightId.value = highlight.id;
  };

  /** Steps through an annotation's highlights in reading order. */
  const stepHighlight = (annotationId: string, direction: 1 | -1) => {
    const annotation = agentAnnotations.value.find((a) => a.id === annotationId);
    if (!annotation?.highlights.length) return;
    const ordered = [...annotation.highlights].sort((a, b) => a.seq - b.seq);
    const current = ordered.findIndex((h) => h.id === activeHighlightId.value);
    const next =
      current === -1
        ? direction === 1 ? 0 : ordered.length - 1
        : (current + direction + ordered.length) % ordered.length;
    goToHighlight(annotationId, ordered[next]);
  };

  const requestAgentAnnotation = async (prompt: string) => {
    const pkg = useViewerStore().agentAnnotationPackage;
    if (!pkg?.requestAnnotationFunc || !prompt.trim()) return;

    // Placeholder shown while the agent reads the book (IP-018 Q4: status pending).
    const placeholder: IAgentAnnotation = {
      id: nextId('pending'),
      title: prompt.trim(),
      prompt: prompt.trim(),
      status: 'pending',
      highlights: [],
    };
    agentAnnotations.value.unshift(placeholder);

    const replace = (annotation: IAgentAnnotation) => {
      const index = agentAnnotations.value.findIndex((a) => a.id === placeholder.id);
      if (index !== -1) agentAnnotations.value.splice(index, 1, annotation);
    };

    try {
      const annotation = await pkg.requestAnnotationFunc(prompt.trim());
      replace(annotation);
      const first = [...annotation.highlights].sort((a, b) => a.seq - b.seq)[0];
      if (first) goToHighlight(annotation.id, first);
    } catch (error) {
      console.error('Agent annotation failed:\n', error);
      replace({ ...placeholder, status: 'failed' });
    }
  };

  const deleteHighlight = async (annotationId: string, highlightId: string) => {
    const annotation = agentAnnotations.value.find((a) => a.id === annotationId);
    if (!annotation) return;
    const index = annotation.highlights.findIndex((h) => h.id === highlightId);
    if (index === -1) return;

    const [removed] = annotation.highlights.splice(index, 1);
    if (activeHighlightId.value === highlightId) activeHighlightId.value = null;
    try {
      await useViewerStore().agentAnnotationPackage?.deleteHighlightFunc?.(annotationId, highlightId);
    } catch (error) {
      console.error('Failed to delete highlight:\n', error);
      annotation.highlights.splice(index, 0, removed);
    }
  };

  const deleteAnnotation = async (annotationId: string) => {
    const index = agentAnnotations.value.findIndex((a) => a.id === annotationId);
    if (index === -1) return;

    const [removed] = agentAnnotations.value.splice(index, 1);
    try {
      await useViewerStore().agentAnnotationPackage?.deleteAnnotationFunc?.(annotationId);
    } catch (error) {
      console.error('Failed to delete agent annotation:\n', error);
      agentAnnotations.value.splice(index, 0, removed);
    }
  };

  const openHighlightsSidebar = () => {
    const docStore = useDocumentStore();
    if (docStore.sidebarState !== SIDEBAR_STATE.HIGHLIGHTS) {
      docStore.setSidebarState(SIDEBAR_STATE.HIGHLIGHTS);
    }
  };

  /** Called when a new document loads, so nothing leaks from the previous one. */
  const reset = () => {
    regionsByPage.value = new Map();
    regionsRequested.clear();
    focusedRegionId.value = null;
    explainRequest.value = null;
    messages.value = [];
    pendingContexts.value = [];
    currentChatId.value = null;
    isCurrentChatReadOnly.value = false;
    chatView.value = 'chat';
    chatsStale = true;
    activeHighlightId.value = null;
    hiddenAnnotationIds.value = new Set();
  };

  return {
    // regions
    regionsByPage,
    focusedRegionId,
    loadRegions,
    findRegion,
    goToRegion,
    // explain
    explainRequest,
    explainPosition,
    openExplain,
    closeExplain,
    // chat
    isChatOpen,
    messages,
    pendingContexts,
    isGenerating,
    focusInputTick,
    openChat,
    addContext,
    removeContext,
    sendMessage,
    resetChat,
    currentChatId,
    isCurrentChatReadOnly,
    // chat history
    chatView,
    chats,
    chatsLoading,
    chatsFailed,
    openingChatId,
    hasHistory,
    loadChats,
    toggleHistory,
    openPastChat,
    deleteChat,
    // agent annotations
    agentAnnotations,
    showAgentHighlights,
    hiddenAnnotationIds,
    activeHighlightId,
    loadAgentAnnotations,
    isAnnotationVisible,
    toggleAnnotation,
    annotationColorIndex,
    highlightsOnPage,
    findHighlight,
    goToHighlight,
    stepHighlight,
    requestAgentAnnotation,
    deleteHighlight,
    deleteAnnotation,
    openHighlightsSidebar,
    reset,
  };
});
