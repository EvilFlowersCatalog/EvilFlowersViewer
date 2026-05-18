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
  <div class="flex flex-col h-full gap-[10px]">
    <!-- Search input -->
    <div class="flex items-center gap-[6px] bg-white dark:bg-white/5 rounded-[7px] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] px-[5px] h-[28px]">
      <div class="size-[16px] rounded-[15px] bg-[rgba(217,217,217,0.2)] shadow-[inset_1px_1px_2.5px_rgba(0,0,0,0.25)] flex items-center justify-center shrink-0">
        <svg class="size-[10px] text-[#333] dark:text-gray-300" viewBox="0 0 16 16" fill="none">
          <path d="M6.66667 13.3333C8.14581 13.333 9.58234 12.8379 10.7475 11.9267L14.4108 15.59L15.5892 14.4117L11.9258 10.7483C12.8375 9.58305 13.333 8.1462 13.3333 6.66667C13.3333 2.99083 10.3425 0 6.66667 0C2.99083 0 0 2.99083 0 6.66667C0 10.3425 2.99083 13.3333 6.66667 13.3333ZM6.66667 1.66667C9.42417 1.66667 11.6667 3.90917 11.6667 6.66667C11.6667 9.42417 9.42417 11.6667 6.66667 11.6667C3.90917 11.6667 1.66667 9.42417 1.66667 6.66667C1.66667 3.90917 3.90917 1.66667 6.66667 1.66667Z" fill="currentColor"/>
        </svg>
      </div>
      <input
        name="search-pattern"
        class="flex-1 min-w-0 bg-transparent text-[10px] font-light text-[#333] dark:text-gray-200 placeholder:text-[#b1b1b1] tracking-[0.1px] outline-none"
        type="text"
        :value="inputValue"
        :placeholder="$t('input-search-pattern')"
        @keydown.stop
        @input="handleInputChange"
      />
    </div>

    <!-- Searching -->
    <div v-if="searchState === SEARCH_STATE.SEARCHING" class="flex justify-center py-6">
      <Loader :size="28" color="#0077cc" />
    </div>

    <!-- Results -->
    <div v-else-if="searchState === SEARCH_STATE.DONE && matches.length > 0" class="flex flex-col gap-[10px] overflow-auto">
      <p class="text-[9px] font-normal text-[#333] dark:text-gray-300 tracking-[0.1px]">
        {{ $t('results') }}: {{ matches.length }}
      </p>
      <button
        v-for="(match, index) in matches"
        class="flex flex-col items-start pl-[5px] pr-[4px] pt-[6px] pb-[2px] text-left transition-colors"
        :key="index"
        :class="selectedMatch === index
          ? 'bg-[rgba(0,119,204,0.2)] shadow-[0px_0px_1.5px_rgba(0,0,0,0.25)]'
          : 'bg-[#f5f7fa] dark:bg-white/5 drop-shadow-[0px_0px_0.75px_rgba(0,0,0,0.25)]'"
        @click="handleSelect(index, match!.page)"
      >
        <span class="text-[9px] font-light text-black dark:text-gray-200 leading-[12px]">
          {{ match?.text }}
        </span>
        <span class="self-end text-[8px] font-normal text-black dark:text-gray-300 leading-[20px]">{{ match?.page }}</span>
      </button>
    </div>

    <!-- No results -->
    <div v-else-if="searchState === SEARCH_STATE.DONE" class="flex justify-center py-6">
      <span class="text-[10px] text-[#b1b1b1]">{{ $t('not-found') }}</span>
    </div>
  </div>
</template>
