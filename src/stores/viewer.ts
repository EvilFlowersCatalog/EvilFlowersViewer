import { CITATION_FORMAT, CITATION_TYPE, SUGGESTION_KIND } from '@/assets/utils/enums';
import type {
  IAgentAnnotationPackage,
  IReaderHighlightPackage,
  IChatPackage,
  IEditPackage,
  IExplainContext,
  IExplainResult,
  IRegionPackage,
  IPageBookmarkPackage,
  ISemanticSearchResult,
  ISuggestedEntry,
  IViewerConfig,
  IViewerEventMap,
  IViewerOptions,
} from '@/assets/utils/interfaces';
import { EventBus, type Unsubscribe } from '@/core/events/EventBus';
import { Telemetry } from '@/core/telemetry/Telemetry';
import { instrumentHost } from '@/core/telemetry/instrumentHost';
import { defineStore } from 'pinia';
import { markRaw, ref } from 'vue';

/** `options.on*` callback → the viewer event it listens to (adapter for the bus). */
const CALLBACK_EVENTS = {
  onDocumentLoaded: 'document-loaded',
  onFirstPageRendered: 'first-page-rendered',
  onDocumentError: 'document-error',
  onLoadProgress: 'load-progress',
  onStreamError: 'stream-error',
  onPageChange: 'page-change',
  onSearch: 'search',
  onSearchResultSelect: 'search-select',
  onSelectionChange: 'selection-change',
} as const satisfies Partial<Record<keyof IViewerOptions, keyof IViewerEventMap>>;

/**
 * The host port: the host's services (functions and packages), its config,
 * and the event bus + telemetry the viewer reports through. Written by
 * `bindOptions` at mount and by `controller.setOptions`.
 */
export const useViewerStore = defineStore('viewer', () => {
  /** Public events; `controller.on` and the `options.on*` callbacks listen here. */
  const events = markRaw(new EventBus<IViewerEventMap>());
  const telemetry = markRaw(new Telemetry());

  const citation = ref<string | null>(null);
  const basedCitation = ref<string | null>(null);
  const shareLink = ref<string>('');
  const citationType = ref<CITATION_TYPE>(CITATION_TYPE.BIB);
  const citationFormat = ref<CITATION_FORMAT>(CITATION_FORMAT.BIBTEX);
  const lang = ref<string>('en');
  const title = ref<string | null>(null);
  const homeFunction = ref<(() => void) | null>(null);
  const closeFunction = ref<(() => void) | null>(null);
  const shareFunction = ref<((pages: string | null, expaireDate: string) => Promise<string>) | null>(null);
  const printFunction = ref<((pages: string | null) => Promise<string>) | null>(null);
  const semanticSearchFunction = ref<
    ((query: string, context?: { page: number }) => Promise<ISemanticSearchResult[]>) | null
  >(null);
  const editPackage = ref<IEditPackage | null>(null);
  const pageBookmarkPackage = ref<IPageBookmarkPackage | null>(null);
  const openEntryDetailFunction = ref<((entry: ISuggestedEntry) => void) | null>(null);
  const bookmarkToggleFunction = ref<
    ((entry: ISuggestedEntry) => Promise<{ isOnShelf: boolean; shelfRecordId?: string | null }>) | null
  >(null);
  const suggestionsFunction = ref<
    ((kind: SUGGESTION_KIND, context?: { selectedText?: string; page?: number }) => Promise<ISuggestedEntry[]>) | null
  >(null);
  const explainFunction = ref<
    ((selectedText: string, context?: IExplainContext) => Promise<IExplainResult>) | null
  >(null);
  const chatPackage = ref<IChatPackage | null>(null);
  const regionPackage = ref<IRegionPackage | null>(null);
  const agentAnnotationPackage = ref<IAgentAnnotationPackage | null>(null);
  const readerHighlightPackage = ref<IReaderHighlightPackage | null>(null);
  const keyboardShortcuts = ref<'auto' | 'off'>('auto');
  const citationMetadata = ref<boolean>(true);
  const config = ref<Required<IViewerConfig>>({ download: false, share: false, print: false, edit: false });

  // Host services, by option key. Each is wrapped for telemetry (`host.call`).
  const SERVICES = {
    homeFunction,
    closeFunction,
    shareFunction,
    printFunction,
    semanticSearchFunction,
    editPackage,
    pageBookmarkPackage,
    openEntryDetailFunction,
    bookmarkToggleFunction,
    suggestionsFunction,
    explainFunction,
    chatPackage,
    regionPackage,
    agentAnnotationPackage,
    readerHighlightPackage,
  } as const;

  let callbackOffs: Unsubscribe[] = [];

  /**
   * Applies host options. With `partial`, only the keys present change (a
   * React host re-passing fresh closures keeps them current); a key set to
   * null removes that service.
   */
  const bindOptions = (options: IViewerOptions | null | undefined, { partial = false } = {}) => {
    const given = options ?? {};
    const has = (key: keyof IViewerOptions) => !partial || key in given;

    if (has('telemetry')) telemetry.setSink(given.telemetry ?? null);
    const services = instrumentHost(telemetry, given);
    for (const [key, target] of Object.entries(SERVICES)) {
      if (has(key as keyof IViewerOptions))
        (target as { value: unknown }).value = (services as Record<string, unknown>)[key] ?? null;
    }
    if (has('citationBib')) citation.value = basedCitation.value = given.citationBib ?? null;
    if (has('title')) title.value = given.title ?? null;
    if (has('lang')) lang.value = given.lang ?? 'en';
    if (has('keyboardShortcuts')) keyboardShortcuts.value = given.keyboardShortcuts ?? 'auto';
    if (has('citationMetadata')) citationMetadata.value = given.citationMetadata ?? true;

    // Legacy callbacks become bus listeners: one emission, every consumer.
    const callbackKeys = Object.keys(CALLBACK_EVENTS) as (keyof typeof CALLBACK_EVENTS)[];
    if (!partial || callbackKeys.some((key) => key in given)) {
      callbackOffs.forEach((off) => off());
      callbackOffs = [];
      for (const key of callbackKeys) {
        // Each callback's payload type matches its event (CALLBACK_EVENTS).
        const listener = given[key] as ((payload: unknown) => void) | null | undefined;
        if (listener) callbackOffs.push(events.on(CALLBACK_EVENTS[key] as keyof IViewerEventMap, listener));
      }
    }
  };

  const bindConfig = (value: IViewerConfig | null | undefined) => {
    config.value = { download: false, share: false, print: false, edit: false, ...value };
  };

  const dispose = () => {
    callbackOffs.forEach((off) => off());
    callbackOffs = [];
    events.clear();
    telemetry.dispose();
  };

  return {
    events,
    telemetry,
    citation,
    basedCitation,
    shareLink,
    citationType,
    citationFormat,
    lang,
    title,
    homeFunction,
    closeFunction,
    shareFunction,
    printFunction,
    semanticSearchFunction,
    editPackage,
    pageBookmarkPackage,
    openEntryDetailFunction,
    bookmarkToggleFunction,
    suggestionsFunction,
    explainFunction,
    chatPackage,
    regionPackage,
    agentAnnotationPackage,
    readerHighlightPackage,
    keyboardShortcuts,
    citationMetadata,
    config,
    bindOptions,
    bindConfig,
    dispose,
  };
});
