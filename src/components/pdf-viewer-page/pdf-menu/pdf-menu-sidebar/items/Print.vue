<script setup lang="ts">
import { ERROR_LINK, KB } from '@/assets/utils/constans';
import { debounce } from '@/assets/utils/functions';
import { useDocumentStore, useViewerStore } from '@/stores';
import printJS from 'print-js';
import { ref } from 'vue';
import Loader from '@/components/pdf-aids/Loader.vue';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const showLoading = ref<boolean>(false);
const inputValue = ref<string>('');
const isInappropriate = ref<boolean>(false);
const error = ref<boolean>(false);
const useEdit = ref<boolean>(false);

const handlePagesInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const eventInput = target.value;
  const pattern = /^((([0-9]+),?)*|(([0-9]+)-?))*$/;
  const pattern2 = /^.*(([0-9]+)-([0-9]+)-)+$/;

  if (pattern.test(eventInput) && !pattern2.test(eventInput)) {
    inputValue.value = eventInput;
    const last = eventInput[eventInput.length - 1];
    isInappropriate.value = last === ',' || last === '-';
  } else {
    target.value = inputValue.value;
  }
};

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
        const chunkSize = 64 * KB;
        let binaryString = '';

        showLoading.value = true;

        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk: any = data.slice(i, i + chunkSize);
          binaryString += String.fromCharCode.apply(null, chunk);
        }

        const base64 = btoa(binaryString);
        printJS({ printable: base64, type: 'pdf', base64: true });
      } catch {
        error.value = true;
      } finally {
        setTimeout(() => (showLoading.value = false), 500);
      }
    } else {
      error.value = true;
    }
  }
});

const print = () => {
  showLoading.value = true;
  convert();
};
</script>

<template>
  <Loader v-if="showLoading" class="m-auto" :size="40" color="#0077cc" />

  <div v-else class="flex flex-col gap-[10px] h-full">
    <!-- Page range input -->
    <div class="flex items-center bg-white dark:bg-white/5 rounded-[7px] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] px-[8px] h-[28px]">
      <span class="text-[10px] text-[#333] dark:text-gray-300 tracking-[0.1px] leading-[20px] shrink-0">{{ $t('pages') }}:</span>
      <input
        name="print-input"
        class="flex-1 min-w-0 ml-[4px] bg-transparent text-[10px] font-light text-[#333] dark:text-gray-200 placeholder:text-[#b1b1b1] tracking-[0.1px] outline-none"
        type="text"
        :placeholder="'1, 4-7, 10'"
        @keydown.stop
        @input="handlePagesInput"
      />
    </div>

    <!-- Add edits radio -->
    <label class="flex items-center gap-[6px] cursor-pointer select-none pl-[5px]">
      <span class="size-[11px] rounded-full border border-[#333] dark:border-gray-400 flex items-center justify-center shrink-0">
        <span v-if="useEdit" class="size-[5px] rounded-full bg-[#333] dark:bg-gray-200"></span>
      </span>
      <input type="checkbox" v-model="useEdit" class="hidden" />
      <span class="text-[10px] text-[#333] dark:text-gray-300 leading-[1.4]">{{ $t('enable-edit') }}</span>
    </label>

    <span v-if="error" class="text-center text-[10px] text-red-500">{{ $t('went-wrong') }}</span>

    <span class="flex-1"></span>

    <div class="flex justify-center">
      <button
        v-if="!isInappropriate"
        class="bg-[#0077cc] hover:bg-[#0066b3] text-[#f5f7fa] text-[10px] font-semibold leading-[1.4] rounded-[7px] px-[14px] h-[20px] shadow-[0px_4px_6px_rgba(0,0,0,0.1)] transition-colors"
        @click="print"
      >
        {{ $t('print') }}
      </button>
    </div>
  </div>
</template>
