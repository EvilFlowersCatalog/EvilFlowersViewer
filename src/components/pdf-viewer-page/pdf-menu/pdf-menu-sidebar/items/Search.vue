<script setup lang="ts">
import { RENDER_STATE, SEARCH_STATE } from '@/assets/utils/enums';
import { debounce } from '@/assets/utils/functions';
import { Loader } from '@/components/pdf-aids';
import { useDocumentStore } from '@/stores';
import type {
  getTextContentParameters,
  TextItem,
} from 'pdfjs-dist/types/src/display/api';
import { onBeforeUnmount, ref, toRaw, watch } from 'vue';

const docStore = useDocumentStore();
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

    searchWorker = new Worker(new URL('./SearchWorker.ts', import.meta.url));
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

const handleInputChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  inputValue.value = target.value;
};

const handleSelect = (index: number, page: number) => {
  const isValidIndex = index >= 0 && index < matches.value.length;
  const isValidPage = page > 0 && page <= docStore.totalPages;
  if (!isValidIndex) return;
  if (page === docStore.activePage) {
    docStore.setReRenderPage(!docStore.reRenderPage);
  } else if (isValidPage) {
    docStore.setActivePage(page);
  }
  selectedMatch.value = index;
};

onBeforeUnmount(() => {
  docStore.setReRenderPage(!docStore.reRenderPage);
});

watch(
  () => inputValue.value,
  () => {
    if (inputValue.value) {
      searchState.value = SEARCH_STATE.SEARCHING;
      searchDocument(inputValue.value);
    } else {
      searchState.value = SEARCH_STATE.NULL;
      matches.value = [];
    }
  }
);

watch(
  () => docStore.pdf,
  () => { pdf = toRaw(docStore.pdf); }
);

watch(
  () => [selectedMatch.value, docStore.renderState, docStore.activePage, matches.value],
  () => {
    const match =
      selectedMatch.value != null && matches?.value[selectedMatch.value];

    if (
      match &&
      docStore.renderState === RENDER_STATE.RENDERED &&
      match.transform &&
      docStore.activePage === match.page
    ) {
      const canvas = document.getElementById(
        'pdf-page-canvas'
      ) as HTMLCanvasElement | null;

      if (canvas) {
        const canvasHeight = parseInt(canvas.getAttribute('height')!);
        const { width, height } = match;
        const x = match.transform[4];
        const y = canvasHeight - match.transform[5] + 2 - height;
        const context = canvas.getContext('2d');

        if (context) {
          context.fillStyle = 'orange';
          context.globalAlpha = 0.5;
          context.fillRect(x, y, width, height);
        }
      }
    }
  }
);
</script>

<template>
  <div class="flex flex-col h-full gap-4">
    <!-- Search input -->
    <div class="relative">
      <svg
        class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M6.66667 13.3333C8.14581 13.333 9.58234 12.8379 10.7475 11.9267L14.4108 15.59L15.5892 14.4117L11.9258 10.7483C12.8375 9.58305 13.333 8.1462 13.3333 6.66667C13.3333 2.99083 10.3425 0 6.66667 0C2.99083 0 0 2.99083 0 6.66667C0 10.3425 2.99083 13.3333 6.66667 13.3333ZM6.66667 1.66667C9.42417 1.66667 11.6667 3.90917 11.6667 6.66667C11.6667 9.42417 9.42417 11.6667 6.66667 11.6667C3.90917 11.6667 1.66667 9.42417 1.66667 6.66667C1.66667 3.90917 3.90917 1.66667 6.66667 1.66667Z" fill="currentColor"/>
      </svg>
      <input
        name="search-pattern"
        class="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 placeholder:text-gray-400 text-sm outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/30 transition-all"
        type="text"
        :value="inputValue"
        :placeholder="$t('input-search-pattern')"
        @keydown.stop
        @input="handleInputChange"
      />
    </div>

    <!-- Initial state -->
    <div v-if="searchState === SEARCH_STATE.NULL" class="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
      <svg class="size-10 opacity-40" viewBox="0 0 24 24" fill="none">
        <path d="M21 21L16.5 16.5M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span class="text-sm">{{ $t('input-search-pattern') }}</span>
    </div>

    <!-- Searching -->
    <div v-else-if="searchState === SEARCH_STATE.SEARCHING" class="flex justify-center py-8">
      <Loader :size="36" color="#36BA98" />
    </div>

    <!-- Results -->
    <div v-else-if="matches.length > 0" class="flex flex-col gap-1 overflow-auto">
      <p class="text-xs text-gray-400 dark:text-gray-500 mb-2">
        {{ $t('results') }}: <span class="font-semibold text-secondary">{{ matches.length }}</span>
      </p>
      <button
        v-for="(match, index) in matches"
        class="flex items-start justify-between gap-2 p-3 rounded-xl border border-gray-100 dark:border-white/10 hover:border-secondary/40 hover:bg-secondary/5 dark:hover:bg-secondary/10 text-left transition-all group"
        :key="index"
        :class="selectedMatch === index ? 'border-secondary/50 bg-secondary/5 dark:bg-secondary/10' : ''"
        @click="handleSelect(index, match!.page)"
      >
        <span class="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white line-clamp-2 flex-1 leading-snug">
          {{ match?.text }}
        </span>
        <span class="text-xs font-bold text-secondary shrink-0 mt-0.5">p.{{ match?.page }}</span>
      </button>
    </div>

    <!-- No results -->
    <div v-else class="flex flex-col items-center gap-2 py-8 text-gray-400 dark:text-gray-500">
      <span class="text-sm">{{ $t('not-found') }}</span>
    </div>
  </div>
</template>
