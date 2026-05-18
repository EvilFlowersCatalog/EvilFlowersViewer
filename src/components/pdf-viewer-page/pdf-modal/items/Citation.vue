<script setup lang="ts">
import { CITATION_FORMAT, CITATION_TYPE } from '@/assets/utils/enums';
import { useDocumentStore, useViewerStore } from '@/stores';
import { ref, watch } from 'vue';
import { BxSolidCopyAlt, AkCheck } from '@kalimahapps/vue-icons';
import { citations } from '@/assets/utils/constans';
// @ts-ignore
import Cite from 'citation-js';

const viewerStore = useViewerStore();
const docStore = useDocumentStore();
const isCopied = ref<boolean>(false);
const isChecked = ref<boolean>(false);

const setCitation = (type: CITATION_TYPE, format: CITATION_FORMAT) => {
  viewerStore.setCitationType(type);
  viewerStore.setCitationFormat(format);
};

const copyCitation = () => {
  if (isCopied.value) return;

  const textarea = document.createElement('textarea');
  textarea.value = viewerStore.citation!;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  isCopied.value = true;
};

const togglePage = () => {
  const pagesPattern = /pages = \{[0-9]*\}/;
  const citationReg = /.*pages = \{[0-9]*\}.*/;
  isChecked.value = !isChecked.value;
  let tmp = viewerStore.basedCitation;

  if (citationReg.test(tmp!)) {
    const updatedCitation =
      tmp?.replace(
        pagesPattern,
        `pages = {${isChecked.value ? docStore.activePage : ''}}`
      ) ?? null;
    viewerStore.setBasedCitation(updatedCitation);
  } else {
    const lastIndex = tmp!.lastIndexOf('}');
    const newTmp = `${tmp!.slice(0, lastIndex)}\t,pages = {${
      docStore.activePage
    }}\n${tmp!.slice(lastIndex)}`;
    viewerStore.setBasedCitation(newTmp);
  }
};

watch(
  () => [viewerStore.citationFormat, viewerStore.citationType],
  () => {
    isCopied.value = false;
  }
);

watch(
  () => [
    viewerStore.citationFormat,
    viewerStore.citationType,
    viewerStore.basedCitation,
  ],
  () => {
    try {
      const cite = new Cite(viewerStore.basedCitation);
      const citation = cite.format(viewerStore.citationFormat);
      viewerStore.setCitation(citation);
    } catch {
      viewerStore.setCitationFormat(CITATION_FORMAT.BIBTEX);
      viewerStore.setCitationType(CITATION_TYPE.BIB);
    }
  }
);
</script>

<template>
  <!-- Citation text box -->
  <div
    class="relative bg-[#f5f7fa] dark:bg-white/5 rounded-[2px] p-3 pr-8 shadow-[inset_0px_1px_4px_0px_rgba(0,0,0,0.25)] cursor-pointer"
    @click="copyCitation"
  >
    <pre
      class="font-sans text-[12px] leading-normal tracking-[0.1px] text-[#333] dark:text-gray-200 whitespace-pre-wrap break-words m-0"
    >{{ viewerStore.citation }}</pre>

    <!-- Copy icon -->
    <button
      type="button"
      class="absolute top-2 right-2 text-[#333] dark:text-gray-300 hover:text-[#07c] transition-colors"
      @click.stop="copyCitation"
    >
      <BxSolidCopyAlt v-if="!isCopied" class="size-[15px]" />
      <AkCheck v-else class="size-[15px] animate-blink-icon" />
    </button>
  </div>

  <!-- Add page -->
  <button
    type="button"
    class="flex items-center gap-[5px] mt-4 group"
    @click="togglePage"
  >
    <span
      class="relative size-[11px] rounded-full border border-[#333] dark:border-gray-300 shrink-0 flex items-center justify-center"
    >
      <span
        v-if="isChecked"
        class="size-[5px] rounded-full bg-[#333] dark:bg-gray-300"
      ></span>
    </span>
    <span
      class="text-[10px] leading-[18px] tracking-[0.1px] text-[#333] dark:text-gray-200"
    >
      {{ $t('add-page') }}
    </span>
  </button>

  <!-- Citation format buttons -->
  <div class="flex items-center justify-center gap-4 mt-4 flex-wrap">
    <button
      v-for="citation of citations"
      :key="citation.name"
      type="button"
      class="h-4 px-[5px] rounded-[4px] text-[10px] leading-normal tracking-[0.1px] text-[#15384e] dark:text-gray-100 transition-colors flex items-center justify-center"
      :class="
        viewerStore.citationFormat === citation.format
          ? 'bg-[#e6f3ff] dark:bg-white/20'
          : 'hover:bg-[#e6f3ff]/60 dark:hover:bg-white/10'
      "
      @click="setCitation(citation.type, citation.format)"
    >
      {{ citation.name }}
    </button>
  </div>
</template>
