// Loads everything the Explain card shows for one request, each part on its
// own so the card fills in as answers arrive: the explanation (streamed when
// the host supports `onPartial`), related passages of this book, and other
// publications on the topic. Closing the card or moving on aborts it all.
import { onScopeDispose, ref, shallowRef, watch, type Ref } from 'vue';
import { SUGGESTION_KIND } from '@/assets/utils/enums';
import type { IExplainResult, ISemanticSearchResult, ISuggestedEntry } from '@/assets/utils/interfaces';
import type { IExplainRequest } from '@/stores/assistant';
import { useViewerStore } from '@/stores';

const RELATED_LIMIT = 4;
const ELSEWHERE_LIMIT = 4;
/** Related passages are looked up by the passage's opening words. */
const QUERY_CHARS = 300;

export type LoadStatus = 'idle' | 'loading' | 'streaming' | 'done' | 'error';

export const useExplanation = (request: Ref<IExplainRequest | null>) => {
  const viewerStore = useViewerStore();
  const result = shallowRef<Partial<IExplainResult> | null>(null);
  const status = ref<LoadStatus>('idle');
  const related = shallowRef<ISemanticSearchResult[]>([]);
  const relatedStatus = ref<LoadStatus>('idle');
  const elsewhere = shallowRef<ISuggestedEntry[]>([]);
  const elsewhereStatus = ref<LoadStatus>('idle');
  let controller: AbortController | null = null;

  const loadExplanation = async (req: IExplainRequest, signal: AbortSignal) => {
    const explain = viewerStore.explainFunction;
    if (!explain) return;
    status.value = 'loading';
    const done = viewerStore.telemetry.start('explain', { nested: !!req.parent, region: !!req.regionId });
    let streamed = false;
    try {
      const final = await explain(req.text, {
        page: req.page,
        regionId: req.regionId,
        parent: req.parent ?? null,
        signal,
        onPartial: (partial) => {
          if (signal.aborted) return;
          streamed = true;
          result.value = { ...result.value, ...partial };
          status.value = 'streaming';
        },
      });
      if (signal.aborted) return;
      result.value = final ? { ...result.value, ...final } : result.value;
      status.value = result.value?.simple ? 'done' : 'error';
      done({ outcome: status.value === 'done' ? 'ok' : 'empty', streamed });
    } catch (error) {
      if (signal.aborted) return;
      console.error('Explain failed:\n', error);
      status.value = result.value?.simple ? 'done' : 'error';
      done({ outcome: 'error' }, { level: 'warn' });
    }
  };

  const loadRelated = async (req: IExplainRequest, signal: AbortSignal) => {
    const search = viewerStore.semanticSearchFunction;
    if (!search || req.regionId) return;
    relatedStatus.value = 'loading';
    try {
      const found = (await search(req.text.slice(0, QUERY_CHARS), { page: req.page })) ?? [];
      if (signal.aborted) return;
      // The passage itself is not "elsewhere".
      related.value = found.filter((r) => r.page !== req.page).slice(0, RELATED_LIMIT);
      relatedStatus.value = 'done';
    } catch {
      if (!signal.aborted) relatedStatus.value = 'error';
    }
  };

  const loadElsewhere = async (req: IExplainRequest, signal: AbortSignal) => {
    const suggest = viewerStore.suggestionsFunction;
    if (!suggest) return;
    elsewhereStatus.value = 'loading';
    try {
      const found = (await suggest(SUGGESTION_KIND.SIMILAR, { selectedText: req.text, page: req.page })) ?? [];
      if (signal.aborted) return;
      elsewhere.value = found.slice(0, ELSEWHERE_LIMIT);
      elsewhereStatus.value = 'done';
    } catch {
      if (!signal.aborted) elsewhereStatus.value = 'error';
    }
  };

  watch(
    request,
    (req) => {
      controller?.abort();
      controller = null;
      result.value = null;
      related.value = [];
      elsewhere.value = [];
      status.value = relatedStatus.value = elsewhereStatus.value = 'idle';
      if (!req) return;
      controller = new AbortController();
      const { signal } = controller;
      // The host's own `related` wins: search is asked only once the
      // explanation settled without one, so a late search never overrides it.
      void loadExplanation(req, signal).then(() => {
        if (!signal.aborted && !result.value?.related?.length) void loadRelated(req, signal);
      });
      // Other publications don't depend on the explanation; it gets the network first.
      setTimeout(() => {
        if (!signal.aborted) void loadElsewhere(req, signal);
      }, 250);
    },
    { immediate: true }
  );

  watch(result, (value) => {
    if (value?.related?.length) {
      related.value = value.related.slice(0, RELATED_LIMIT);
      relatedStatus.value = 'done';
    }
  });

  onScopeDispose(() => controller?.abort());

  return { result, status, related, relatedStatus, elsewhere, elsewhereStatus };
};
