<script setup lang="ts">
import { ERROR_LINK, KB } from '@/assets/utils/constans';
import { debounce } from '@/assets/utils/functions';
import { useDocumentStore, useViewerStore } from '@/stores';
import printJS from 'print-js';
import { ref, toRaw } from 'vue';
import { AnFilledPrinter } from '@kalimahapps/vue-icons';
import { ValidationInput } from '@/components/pdf-aids';
import Loader from '@/components/pdf-aids/Loader.vue';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

// Data
const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const showLoading = ref<boolean>(false);
const inputValue = ref<string>('');
const isInappropriate = ref<boolean>(false);
const error = ref<boolean>(false);
const useEdit = ref<boolean>(false);

// Convert pdf to base64
const convert = debounce(async () => {
  error.value = false;

  const pages: string | null = inputValue.value ? inputValue.value : null;
  let link: string = await viewerStore.printFunction!(pages);
  link = link ? link : ERROR_LINK;

  if (link !== ERROR_LINK) {
    const url = new URL(link);
    url.searchParams.set('annotations', `${useEdit.value}`);

    const doc = await getDocument(url).promise;

    if (doc) {
      const data = await doc.getData();

      try {
        const chunkSize = 64 * KB; // 64KB chunk size
        let binaryString = '';

        // Set loading state to true when the process starts
        showLoading.value = true;

        // Process the Uint8Array in chunks to avoid exceeding the call stack
        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk: any = data.slice(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, chunk);
        }

        // Encode the entire binary string to base64
        const base64 = btoa(binaryString);

        // Print using PrintJS library
        printJS({ printable: base64, type: 'pdf', base64: true });
      } catch {
        error.value = true;
      } finally {
        // Hide loading state after 0.5s
        setTimeout(() => (showLoading.value = false), 500);
      }
    } else {
      error.value = true;
    }
  }
});

// Using PrintJS library to print PDF
const print = () => {
  showLoading.value = true;
  convert();
};
</script>

<template>
  <!-- Print loader -->

  <Loader v-if="showLoading" class="m-auto" :size="50" color="white" />

  <div v-else class="flex h-full flex-col gap-2">
    <ValidationInput
      @updated-input="(value: string) => inputValue = value"
      @is-inappropriate="(value: boolean)=>isInappropriate = value"
      @edit-usage="(value: boolean)=> useEdit = value"
    />

    <!-- Spacer -->
    <span class="flex flex-1"></span>

    <!-- Error message -->
    <span class="text-center" v-if="error">{{ $t('went-wrong') }}</span>

    <!-- Spacer -->
    <span class="flex flex-1"></span>

    <!-- Submit button -->
    <button
      v-if="!isInappropriate"
      class="w-full bg-secondary py-2 flex items-center justify-center rounded-md"
      @click="print"
    >
      <AnFilledPrinter class="icon size-8" />
    </button>
  </div>
</template>
