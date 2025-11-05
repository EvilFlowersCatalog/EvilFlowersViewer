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
  if (!pdf || !window.Worker) return; // Early returns for checks

  // Terminate the previous worker if it's still active
  if (searchWorker) {
    searchWorker.terminate();
    searchWorker = null;
  }

  const textContent: { textItems: Array<TextItem>; page: number }[] = [];

  try {
    // Create an array of promises for getting the text content from each page
    const pagesContent = await Promise.all(
      Array.from(Array(docStore.totalPages).keys()).map(async (n) => {
        const page = await pdf!.getPage(n + 1); // Get the page (1-indexed)
        const e: getTextContentParameters = {
          disableNormalization: false,
          includeMarkedContent: false,
        };
        const content = await page.getTextContent(e);
        return { textItems: content.items as TextItem[], page: n + 1 };
      })
    );

    textContent.push(...pagesContent); // Add the page content

    // Initialize the search worker and send the pattern and content
    searchWorker = new Worker(new URL('./SearchWorker.ts', import.meta.url));
    selectedMatch.value = null;
    searchWorker.postMessage([pattern, textContent]);

    // Handle search results
    searchWorker.onmessage = (e) => {
      matches.value = e.data;
      if (searchWorker) searchWorker.terminate();
      searchWorker = null;
      searchState.value = SEARCH_STATE.DONE;
    };
  } catch {
    // When error, reset
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
  // Return if invalid index
  if (!isValidIndex) return;
  if (page === docStore.activePage) {
    // Trigger rerender if we're on the same page
    docStore.setReRenderPage(!docStore.reRenderPage);
  } else if (isValidPage) {
    // Set the new active page if it's valid
    docStore.setActivePage(page);
  }

  // Update the selected match
  selectedMatch.value = index;
};

// Before unmount rerender page to remove highlight
onBeforeUnmount(() => {
  docStore.setReRenderPage(!docStore.reRenderPage);
});

// Watch input and based on it determin what to do
watch(
  () => inputValue.value,
  () => {
    // If something was written set state to search and search pattern
    if (inputValue.value) {
      searchState.value = SEARCH_STATE.SEARCHING;
      searchDocument(inputValue.value);
    }
    // Else set to null and set to empty arr
    else {
      searchState.value = SEARCH_STATE.NULL;
      matches.value = [];
    }
  }
);

// Watch pdf, if change save
watch(
  () => docStore.pdf,
  () => {
    pdf = toRaw(docStore.pdf);
  }
);

// Watch selected match and renderState, if changed highlight it in document
watch(
  () => [
    selectedMatch.value,
    docStore.renderState,
    docStore.activePage,
    matches.value,
  ],
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
  <div class="flex flex-col h-full">
    <!-- Input -->
    <input
      name="search-pattern"
      class="input"
      type="text"
      :value="inputValue"
      placeholder="Search"
      @keydown.stop
      @input="handleInputChange"
    />

    <!-- Nothing is searched -->
    <span
      v-if="searchState === SEARCH_STATE.NULL"
      class="text-sm text-center font-bold mt-5"
    >
      {{ $t('input-search-pattern') }}
    </span>

    <!-- Searching -->
    <Loader
      v-else-if="searchState === SEARCH_STATE.SEARCHING"
      class="m-auto"
      :size="50"
      color="white"
    />

    <!-- Results -->
    <div
      v-else-if="matches.length > 0"
      class="w-full h-full mt-5 overflow-auto"
    >
      <!-- Title results -->
      <span class="text-sm font-bold"
        >{{ $t('results') }}: {{ matches.length }}</span
      >

      <!-- Button results -->
      <div class="flex flex-col w-full gap-2">
        <button
          v-for="(match, index) in matches"
          class="flex flex-col gap-2 bg-secondary hover:bg-white rounded-md p-2 text-white hover:text-black"
          :key="index"
          @click="handleSelect(index, match!.page)"
        >
          <span class="text-sm font-thin text-left">{{ match?.text }}</span>
          <span class="text-md font-bold text-right w-full"
            >Page {{ match?.page }}</span
          >
        </button>
      </div>
    </div>

    <!-- No results -->
    <span v-else class="text-sm text-center font-bold mt-5">
      {{ $t('not-found') }}
    </span>
  </div>
</template>
