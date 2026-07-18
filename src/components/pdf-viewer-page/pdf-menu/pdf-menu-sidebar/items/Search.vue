<script setup lang="ts">
import { SEARCH_STATE } from '@/assets/utils/enums';
import { debounce } from '@/assets/utils/functions';
import { Loader } from '@/components/pdf-aids';
import { useDocumentStore, useViewerStore } from '@/stores';
import type { ISemanticSearchResult } from '@/assets/utils/interfaces';
import type {
  getTextContentParameters,
  TextItem,
} from 'pdfjs-dist/types/src/display/api';
import { computed, onBeforeUnmount, ref, toRaw, watch } from 'vue';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();

// Semantic search is opt-in: only shown when the host supplies the function.
const hasSemantic = computed(() => !!viewerStore.semanticSearchFunction);

const selectedMatch = ref<number | null>(null);
const searchState = ref<SEARCH_STATE>(SEARCH_STATE.NULL);
const inputValue = ref<string>('');

const matches = ref<
  (
    | {
        page: number;
        text: string;
        transform: Array<number> | undefined;
        width: number;
        height: number;
      }
    | undefined
  )[]
>([]);

// Semantic results + their own loading state (independent of keyword search).
const semanticResults = ref<ISemanticSearchResult[]>([]);
const semanticState = ref<SEARCH_STATE>(SEARCH_STATE.NULL);
const selectedSemantic = ref<number | null>(null);

let searchWorker: Worker | null = null;
let pdf = toRaw(docStore.pdf);

const searchDocument = debounce(async (pattern: string) => {
  if (!pdf || !window.Worker) return;

  if (searchWorker) {
    searchWorker.terminate();
    searchWorker = null;
  }

  const textContent: { textItems: Array<TextItem>; page: number }[] = [];

  try {
    const pagesContent = await Promise.all(
      Array.from(Array(docStore.totalPages).keys()).map(async (n) => {
        const page = await pdf!.getPage(n + 1);
        const e: getTextContentParameters = {
          disableNormalization: false,
          includeMarkedContent: false,
        };
        const content = await page.getTextContent(e);
        return { textItems: content.items as TextItem[], page: n + 1 };
      })
    );

    textContent.push(...pagesContent);

    searchWorker = new Worker(new URL('./SearchWorker.ts', import.meta.url), {
      type: 'module',
    });
    selectedMatch.value = null;
    searchWorker.postMessage([pattern, textContent]);

    searchWorker.onmessage = (e) => {
      matches.value = e.data;
      if (searchWorker) searchWorker.terminate();
      searchWorker = null;
      searchState.value = SEARCH_STATE.DONE;
    };
  } catch {
    inputValue.value = '';
    searchState.value = SEARCH_STATE.NULL;
  }
});

// Tracks the latest semantic query so out-of-order responses are discarded.
let semanticRequestId = 0;
const searchSemantic = debounce(async (query: string) => {
  const fn = viewerStore.semanticSearchFunction;
  if (!fn) return;

  const requestId = ++semanticRequestId;
  semanticState.value = SEARCH_STATE.SEARCHING;
  selectedSemantic.value = null;

  try {
    const results = await fn(query);
    if (requestId !== semanticRequestId) return; // superseded by a newer query
    semanticResults.value = results ?? [];
    semanticState.value = SEARCH_STATE.DONE;
  } catch {
    if (requestId !== semanticRequestId) return;
    semanticResults.value = [];
    semanticState.value = SEARCH_STATE.DONE;
  }
});

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  inputValue.value = target.value;
};

const handleSelect = (index: number, page: number) => {
  const match = matches.value[index];
  if (!match) return;
  selectedMatch.value = index;

  // Hand the hit to the store; PDFPage owns the canvas and draws it. This keeps
  // Search decoupled from the page DOM and lets the highlight survive zoom and
  // page re-renders.
  if (match.transform) {
    docStore.searchHighlight = {
      page: match.page,
      transform: match.transform,
      width: match.width,
      height: match.height,
    };
  }

  if (page > 0 && page <= docStore.totalPages && page !== docStore.activePage) {
    docStore.activePage = page;
  }
};

const handleSelectSemantic = (index: number, page: number) => {
  if (page > 0 && page <= docStore.totalPages && page !== docStore.activePage) {
    docStore.activePage = page;
  }
  selectedSemantic.value = index;
};

onBeforeUnmount(() => {
  if (searchWorker) {
    searchWorker.terminate();
    searchWorker = null;
  }
  // Clear the highlight so closing the panel repaints a clean page.
  docStore.searchHighlight = null;
});

watch(
  () => inputValue.value,
  () => {
    if (inputValue.value) {
      searchState.value = SEARCH_STATE.SEARCHING;
      searchDocument(inputValue.value);
      if (hasSemantic.value) searchSemantic(inputValue.value);
    } else {
      searchState.value = SEARCH_STATE.NULL;
      semanticState.value = SEARCH_STATE.NULL;
      matches.value = [];
      semanticResults.value = [];
    }
  }
);

watch(
  () => docStore.pdf,
  () => {
    pdf = toRaw(docStore.pdf);
  }
);

// Split a result snippet into plain/highlighted parts so the matched query term
// can be bolded (Figma) without resorting to v-html.
const highlightParts = (text: string, term: string) => {
  if (!term) return [{ text, match: false }];
  const parts: { text: string; match: boolean }[] = [];
  const lower = text.toLowerCase();
  const needle = term.toLowerCase();
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      parts.push({ text: text.slice(i), match: false });
      break;
    }
    if (idx > i) parts.push({ text: text.slice(i, idx), match: false });
    parts.push({ text: text.slice(idx, idx + term.length), match: true });
    i = idx + term.length;
  }
  return parts;
};

// Step through keyword / semantic results with the header chevrons (wraps).
const stepMatch = (dir: number) => {
  if (!matches.value.length) return;
  const cur = selectedMatch.value ?? -1;
  const next = (cur + dir + matches.value.length) % matches.value.length;
  const m = matches.value[next];
  if (m) handleSelect(next, m.page);
};
const stepSemantic = (dir: number) => {
  if (!semanticResults.value.length) return;
  const cur = selectedSemantic.value ?? -1;
  const next =
    (cur + dir + semanticResults.value.length) % semanticResults.value.length;
  handleSelectSemantic(next, semanticResults.value[next].page);
};
</script>

<template>
  <div class="flex flex-col h-full gap-[10px]">
    <!-- Search input -->
    <div
      class="flex items-center gap-[6px] bg-white dark:bg-white/5 rounded-[7px] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] px-[8px] h-[28px]"
    >
      <svg
        aria-hidden="true"
        class="size-[11px] shrink-0 text-[#8a8a8a] dark:text-gray-400"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M6.66667 13.3333C8.14581 13.333 9.58234 12.8379 10.7475 11.9267L14.4108 15.59L15.5892 14.4117L11.9258 10.7483C12.8375 9.58305 13.333 8.1462 13.3333 6.66667C13.3333 2.99083 10.3425 0 6.66667 0C2.99083 0 0 2.99083 0 6.66667C0 10.3425 2.99083 13.3333 6.66667 13.3333ZM6.66667 1.66667C9.42417 1.66667 11.6667 3.90917 11.6667 6.66667C11.6667 9.42417 9.42417 11.6667 6.66667 11.6667C3.90917 11.6667 1.66667 9.42417 1.66667 6.66667C1.66667 3.90917 3.90917 1.66667 6.66667 1.66667Z"
          fill="currentColor"
        />
      </svg>
      <input
        name="search-pattern"
        class="flex-1 min-w-0 bg-transparent text-[11px] font-light text-[#333] dark:text-gray-200 placeholder:!text-[#b1b1b1] tracking-[0.1px] outline-none"
        type="text"
        :value="inputValue"
        :aria-label="$t('input-search-pattern')"
        :placeholder="$t('input-search-pattern')"
        @keydown.stop
        @input="handleInputChange"
      />
    </div>

    <!-- Results area: single (keyword) or two columns (keyword + semantic) -->
    <div
      class="flex-1 min-h-0 overflow-hidden"
      :class="hasSemantic ? 'flex gap-3' : 'flex flex-col'"
    >
      <!-- Keyword column -->
      <div class="flex flex-col min-h-0 gap-[10px]" :class="hasSemantic ? 'flex-1' : ''">
        <div
          v-if="hasSemantic"
          class="text-[10px] font-medium uppercase text-efv-muted tracking-[0.1px] shrink-0"
        >
          {{ $t('search') }}
        </div>

        <div v-if="searchState === SEARCH_STATE.SEARCHING" class="flex justify-center py-6">
          <Loader :size="24" color="#0077cc" :label="$t('search')" />
        </div>

        <template v-else-if="searchState === SEARCH_STATE.DONE">
          <div v-if="matches.length > 0" class="flex items-center justify-between shrink-0">
            <p
              class="text-[9px] font-normal text-[#333] dark:text-gray-300 tracking-[0.1px]"
              aria-live="polite"
            >
              {{ $t('results') }}: {{ matches.length }}
            </p>
            <div class="flex items-center gap-[2px]">
              <button
                type="button"
                class="p-[2px] rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#8a8a8a] dark:text-gray-400 transition-colors"
                :aria-label="$t('previous-result')"
                @click="stepMatch(-1)"
              >
                <svg aria-hidden="true" class="size-3" viewBox="0 0 20 20" fill="none"><path d="M5 12l5-5 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button
                type="button"
                class="p-[2px] rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#8a8a8a] dark:text-gray-400 transition-colors"
                :aria-label="$t('next-result')"
                @click="stepMatch(1)"
              >
                <svg aria-hidden="true" class="size-3" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
          <div
            v-if="matches.length > 0"
            class="flex flex-col gap-[8px] overflow-auto pr-[2px]"
          >
            <button
              v-for="(match, index) in matches"
              class="flex flex-col items-start px-[6px] pt-[6px] pb-[2px] rounded-[4px] text-left transition-colors"
              :key="index"
              :class="
                selectedMatch === index
                  ? 'bg-[rgba(0,119,204,0.2)] shadow-[0px_0px_1.5px_rgba(0,0,0,0.25)]'
                  : 'bg-[#f5f7fa] dark:bg-white/5 drop-shadow-[0px_0px_0.75px_rgba(0,0,0,0.25)]'
              "
              :aria-label="`${match?.text}, ${$t('page')} ${match?.page}`"
              :aria-current="selectedMatch === index ? 'true' : undefined"
              @click="handleSelect(index, match!.page)"
            >
              <span class="text-[9px] font-light text-black dark:text-gray-200 leading-[12px]">
                <template
                  v-for="(part, pi) in highlightParts(match?.text ?? '', inputValue)"
                  :key="pi"
                ><strong v-if="part.match" class="font-semibold">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template>
              </span>
              <span
                class="self-end text-[8px] font-normal text-black dark:text-gray-300 leading-[16px]"
              >{{ match?.page }}</span>
            </button>
          </div>
          <div v-else class="flex justify-center py-6">
            <span class="text-[10px] text-[#b1b1b1]">{{ $t('not-found') }}</span>
          </div>
        </template>
      </div>

      <!-- Semantic column (only when the host provides semanticSearchFunction) -->
      <div
        v-if="hasSemantic"
        class="flex flex-col flex-1 min-h-0 gap-[10px] border-l border-gray-100 dark:border-white/10 pl-3"
      >
        <div class="flex items-center gap-1 text-[10px] font-medium uppercase text-secondary tracking-[0.1px] shrink-0">
          <svg aria-hidden="true" class="size-[11px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3l1.9 4.6L18.5 9.5 13.9 11.4 12 16l-1.9-4.6L5.5 9.5l4.6-1.9z" />
          </svg>
          {{ $t('semantic-search') }}
        </div>

        <div v-if="semanticState === SEARCH_STATE.SEARCHING" class="flex justify-center py-6">
          <Loader :size="24" color="#0077cc" :label="$t('semantic-search')" />
        </div>

        <template v-else-if="semanticState === SEARCH_STATE.DONE">
          <div v-if="semanticResults.length > 0" class="flex items-center justify-between shrink-0">
            <p
              class="text-[9px] font-normal text-[#333] dark:text-gray-300 tracking-[0.1px]"
              aria-live="polite"
            >
              {{ $t('results') }}: {{ semanticResults.length }}
            </p>
            <div class="flex items-center gap-[2px]">
              <button
                type="button"
                class="p-[2px] rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#8a8a8a] dark:text-gray-400 transition-colors"
                :aria-label="$t('previous-result')"
                @click="stepSemantic(-1)"
              >
                <svg aria-hidden="true" class="size-3" viewBox="0 0 20 20" fill="none"><path d="M5 12l5-5 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
              <button
                type="button"
                class="p-[2px] rounded hover:bg-black/5 dark:hover:bg-white/10 text-[#8a8a8a] dark:text-gray-400 transition-colors"
                :aria-label="$t('next-result')"
                @click="stepSemantic(1)"
              >
                <svg aria-hidden="true" class="size-3" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </div>
          <div
            v-if="semanticResults.length > 0"
            class="flex flex-col gap-[8px] overflow-auto pr-[2px]"
          >
            <button
              v-for="(result, index) in semanticResults"
              class="flex flex-col items-start px-[6px] pt-[6px] pb-[2px] rounded-[4px] text-left transition-colors"
              :key="index"
              :class="
                selectedSemantic === index
                  ? 'bg-[rgba(0,119,204,0.2)] shadow-[0px_0px_1.5px_rgba(0,0,0,0.25)]'
                  : 'bg-[#f5f7fa] dark:bg-white/5 drop-shadow-[0px_0px_0.75px_rgba(0,0,0,0.25)]'
              "
              :aria-label="`${result.text}, ${$t('page')} ${result.page}`"
              :aria-current="selectedSemantic === index ? 'true' : undefined"
              @click="handleSelectSemantic(index, result.page)"
            >
              <span class="text-[9px] font-light text-black dark:text-gray-200 leading-[12px]">
                <template
                  v-for="(part, pi) in highlightParts(result.text ?? '', inputValue)"
                  :key="pi"
                ><strong v-if="part.match" class="font-semibold">{{ part.text }}</strong><template v-else>{{ part.text }}</template></template>
              </span>
              <span
                class="self-end text-[8px] font-normal text-black dark:text-gray-300 leading-[16px]"
              >{{ result.page }}</span>
            </button>
          </div>
          <div v-else class="flex justify-center py-6">
            <span class="text-[10px] text-[#b1b1b1]">{{ $t('not-found') }}</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
