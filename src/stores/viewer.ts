import { CITATION_FORMAT, CITATION_TYPE, SUGGESTION_KIND } from '@/assets/utils/enums';
import type {
  IAgentAnnotationPackage,
  IReaderHighlightPackage,
  IChatPackage,
  IDocumentErrorInfo,
  IDocumentLoadedInfo,
  ILoadProgressInfo,
  IPageChangeInfo,
  IStreamErrorInfo,
  IEditPackage,
  IFirstPageRenderedInfo,
  IExplainContext,
  IExplainResult,
  IRegionPackage,
  IPageBookmarkPackage,
  ISemanticSearchResult,
  ISearchSelectInfo,
  ISearchSummary,
  ISuggestedEntry,
  IViewerConfig,
} from '@/assets/utils/interfaces';
import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * Host-provided configuration and callbacks, plus a little citation UI state.
 * Everything here is a plain ref written once at mount (or by the citation
 * panel), so it is exposed directly rather than behind passthrough setters.
 */
export const useViewerStore = defineStore('viewer', () => {
  const citation = ref<string | null>(null);
  const basedCitation = ref<string | null>(null);
  const shareLink = ref<string>('');
  const citationType = ref<CITATION_TYPE>(CITATION_TYPE.BIB);
  const citationFormat = ref<CITATION_FORMAT>(CITATION_FORMAT.BIBTEX);
  const lang = ref<string>('en');
  const title = ref<string | null>(null);
  const homeFunction = ref<(() => void) | null>(null);
  const closeFunction = ref<(() => void) | null>(null);
  const shareFunction = ref<
    ((pages: string | null, expaireDate: string) => Promise<string>) | null
  >(null);
  const printFunction = ref<((pages: string | null) => Promise<string>) | null>(
    null
  );
  const semanticSearchFunction = ref<
    | ((
        query: string,
        context?: { page: number }
      ) => Promise<ISemanticSearchResult[]>)
    | null
  >(null);
  const onSearch = ref<((summary: ISearchSummary) => void) | null>(null);
  const onSearchResultSelect = ref<((info: ISearchSelectInfo) => void) | null>(
    null
  );
  const editPackage = ref<IEditPackage | null>(null);
  const pageBookmarkPackage = ref<IPageBookmarkPackage | null>(null);
  const openEntryDetailFunction = ref<((entry: ISuggestedEntry) => void) | null>(
    null
  );
  const bookmarkToggleFunction = ref<
    | ((
        entry: ISuggestedEntry
      ) => Promise<{ isOnShelf: boolean; shelfRecordId?: string | null }>)
    | null
  >(null);
  const suggestionsFunction = ref<
    | ((
        kind: SUGGESTION_KIND,
        context?: { selectedText?: string; page?: number }
      ) => Promise<ISuggestedEntry[]>)
    | null
  >(null);
  const explainFunction = ref<
    ((selectedText: string, context?: IExplainContext) => Promise<IExplainResult>) | null
  >(null);
  const chatPackage = ref<IChatPackage | null>(null);
  const regionPackage = ref<IRegionPackage | null>(null);
  const agentAnnotationPackage = ref<IAgentAnnotationPackage | null>(null);
  const readerHighlightPackage = ref<IReaderHighlightPackage | null>(null);
  const onFirstPageRendered = ref<
    ((info: IFirstPageRenderedInfo) => void) | null
  >(null);
  const onDocumentError = ref<((info: IDocumentErrorInfo) => void) | null>(
    null
  );
  const onDocumentLoaded = ref<((info: IDocumentLoadedInfo) => void) | null>(
    null
  );
  const onLoadProgress = ref<((info: ILoadProgressInfo) => void) | null>(null);
  const onPageChange = ref<((info: IPageChangeInfo) => void) | null>(null);
  const onStreamError = ref<((info: IStreamErrorInfo) => void) | null>(null);
  const config = ref<IViewerConfig>({
    download: false,
    share: false,
    print: false,
    edit: false,
  });

  return {
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
    onSearch,
    onSearchResultSelect,
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
    onFirstPageRendered,
    onDocumentError,
    onDocumentLoaded,
    onLoadProgress,
    onPageChange,
    onStreamError,
    config,
  };
});
