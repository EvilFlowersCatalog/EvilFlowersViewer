<script setup lang="ts">
// Print: everything, this page, or pages; with or without your annotations.
// The host renders the print copy (`options.printFunction`); it goes to the
// browser's print dialog by URL, without parsing it again here.
import { computed, ref } from 'vue';
import printJS from 'print-js';
import { ERROR_LINK } from '@/assets/utils/constans';
import { useDocumentStore, useViewerStore } from '@/stores';

const viewerStore = useViewerStore();
const docStore = useDocumentStore();

const scope = ref<'document' | 'page' | 'pages'>('document');
const customPages = ref('');
const withAnnotations = ref(false);
const status = ref<'idle' | 'working' | 'error'>('idle');

const RANGE = /^\s*\d+(\s*-\s*\d+)?(\s*,\s*\d+(\s*-\s*\d+)?)*\s*$/;
const rangeValid = computed(() => scope.value !== 'pages' || RANGE.test(customPages.value));

const print = async () => {
  if (!viewerStore.printFunction || !rangeValid.value) return;
  status.value = 'working';
  const pages =
    scope.value === 'document'
      ? null
      : scope.value === 'page'
        ? String(docStore.activePage)
        : customPages.value.replace(/\s+/g, '');
  try {
    const result = (await viewerStore.printFunction(pages)) || ERROR_LINK;
    if (result === ERROR_LINK) throw new Error('no print link');
    const url = new URL(result);
    url.searchParams.set('annotations', String(withAnnotations.value));
    printJS({
      printable: url.toString(),
      type: 'pdf',
      showModal: false,
      onLoadingEnd: () => (status.value = 'idle'),
      onError: () => (status.value = 'error'),
    });
  } catch (error) {
    console.error('Print failed:\n', error);
    status.value = 'error';
  }
};
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <div class="grid grid-cols-3 gap-0.5 p-0.5 rounded-[9px] bg-black/[0.05] dark:bg-white/[0.07]">
      <button
        v-for="option in (['document', 'page', 'pages'] as const)"
        :key="option"
        type="button"
        class="h-7 rounded-[7px] text-[12.5px] font-medium transition"
        :class="scope === option ? 'bg-white dark:bg-[#3a3a3c] shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-[#6e6e73] dark:text-gray-400'"
        :aria-pressed="scope === option"
        @click="scope = option"
      >
        {{ option === 'page' ? $t('share-this-page', { page: docStore.pageLabel(docStore.activePage) ?? docStore.activePage }) : $t(`share-${option}`) }}
      </button>
    </div>
    <input
      v-if="scope === 'pages'"
      v-model="customPages"
      type="text"
      inputmode="numeric"
      class="h-9 px-3 rounded-[9px] text-[13px] bg-black/[0.04] dark:bg-white/[0.06] outline-none focus:ring-2 focus:ring-[#0077cc]/70"
      :class="customPages && !rangeValid ? 'ring-2 ring-[#ff3b30]/70' : ''"
      placeholder="1, 4–7, 10"
      :aria-label="$t('pages')"
    />
    <label v-if="viewerStore.editPackage" class="flex items-center gap-2 text-[13px] cursor-pointer select-none">
      <input v-model="withAnnotations" type="checkbox" class="accent-[#0077cc] size-4" />
      {{ $t('share-with-annotations') }}
    </label>
    <p v-if="status === 'error'" class="text-[12.5px] text-[#ff3b30]">{{ $t('went-wrong') }}</p>
    <button
      type="button"
      class="h-9 rounded-[9px] bg-[#0077cc] hover:bg-[#006bb8] disabled:opacity-40 text-white text-[13.5px] font-semibold transition-colors"
      :disabled="status === 'working' || !rangeValid || (scope === 'pages' && !customPages)"
      @click="print"
    >
      {{ status === 'working' ? $t('print-preparing') : $t('print') }}
    </button>
  </div>
</template>
