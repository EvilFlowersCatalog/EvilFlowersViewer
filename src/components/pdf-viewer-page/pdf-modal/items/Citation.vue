<script setup lang="ts">
import { CITATION_FORMAT, CITATION_TYPE } from '@/assets/utils/enums';
import { useDocumentStore, useViewerStore } from '@/stores';
import { ref, watch } from 'vue';
import { BxSolidCopyAlt, AkCheck } from '@kalimahapps/vue-icons';
import { citations } from '@/assets/utils/constans';
// @ts-ignore
import Cite from 'citation-js';

// Data
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

  // Create a temporary textarea element
  const textarea = document.createElement('textarea');
  textarea.value = viewerStore.citation!;
  document.body.appendChild(textarea);

  // select and copy the text
  textarea.select();
  document.execCommand('copy');

  // remove the temporary textarea
  document.body.removeChild(textarea);
  isCopied.value = true;
};

const addPage = (e: Event) => {
  const pagesPattern = /pages = \{[0-9]*\}/;
  const citationReg = /.*pages = \{[0-9]*\}.*/;
  const target = e.target as HTMLInputElement;
  isChecked.value = target.checked;
  let tmp = viewerStore.basedCitation;

  // if it contains pages
  if (citationReg.test(tmp!)) {
    // Replace the "pages" line with the updated value
    const updatedCitation =
      tmp?.replace(
        pagesPattern,
        `pages = {${target.checked ? docStore.activePage : ''}}`
      ) ?? null;
    viewerStore.setBasedCitation(updatedCitation);
  }
  // if not
  else {
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

// If citation format or type change, change the citation
watch(
  () => [
    viewerStore.citationFormat,
    viewerStore.citationType,
    viewerStore.basedCitation,
  ],
  () => {
    try {
      // Set new Cite based on citation
      const cite = new Cite(viewerStore.basedCitation);

      // Convert our citation to wanted one
      const citation = cite.format(viewerStore.citationFormat);

      // Set new citation
      viewerStore.setCitation(citation);
    } catch {
      // If failed reset to bibtex
      viewerStore.setCitationFormat(CITATION_FORMAT.BIBTEX);
      viewerStore.setCitationType(CITATION_TYPE.BIB);
    }
  }
);
</script>

<template>
  <div
    class="relative border-4 rounded-md p-2 whitespace-pre-wrap text-sm break-words"
    :class="
      isCopied
        ? 'cursor-auto animate-blink-border'
        : 'cursor-pointer border-dashed animate-none'
    "
    @click="copyCitation"
  >
    <!-- Copy icons -->
    <BxSolidCopyAlt
      v-if="!isCopied"
      class="size-4 text-secondary absolute top-1 right-1"
    />
    <AkCheck
      v-else
      class="size-4 text-secondary absolute top-1 right-1 opacity-0 animate-blink-icon"
    />

    <!-- Citation -->
    {{ viewerStore.citation }}
  </div>

  <!-- Add pages to citation -->
  <div class="flex items-center gap-4 mt-4">
    <!-- Checkbox -->
    <input
      class="checkbox"
      type="checkbox"
      :checked="isChecked"
      @change="(e) => addPage(e)"
    />

    <!-- Pages -->
    <span :class="!isChecked ? 'text-gray-500' : 'text-white'">
      {{ $t('add-page') }}
    </span>
  </div>

  <!-- Switch citation -->
  <div class="flex flex-wrap w-full justify-center items-center mt-4 gap-2">
    <button
      v-for="citation of citations"
      :key="citation.name"
      class="w-fit py-1 px-2 text-white hover:bg-secondary rounded-md"
      :class="viewerStore.citationFormat === citation.format && 'bg-secondary'"
      @click="setCitation(citation.type, citation.format)"
    >
      {{ citation.name }}
    </button>
  </div>
</template>
