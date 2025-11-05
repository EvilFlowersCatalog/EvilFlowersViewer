<script setup lang="ts">
import { MODAL_CONTENT } from '@/assets/utils/enums';
import { ref, onMounted } from 'vue';
import { Citation, TOC, QRCode } from './items';
import { useDocumentStore, useViewerStore } from '@/stores';

// Data
const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const modalRef = ref<HTMLDivElement | null>(null);

// Map content types to components
const modalHolder: {
  [key in MODAL_CONTENT]: {
    content?: any;
    label?: string;
    func?: () => void;
  } | null;
} = {
  [MODAL_CONTENT.NULL]: null,
  [MODAL_CONTENT.TOC]: { content: TOC },
  [MODAL_CONTENT.CITATE]: {
    content: Citation,
    label: 'download',
    func: () => {
      const fileName = 'document-citation.' + `${viewerStore.citationType}`;
      const link = document.createElement('a');
      const blob = new Blob([viewerStore.citation!], { type: 'text/plain' });

      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
    },
  },
  [MODAL_CONTENT.QRCode]: {
    content: QRCode,
    label: 'download',
    func: () => {
      const canvas: any = document.getElementById('QRCode');
      if (canvas) {
        const pngUrl = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');
        let downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `QR-code.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    },
  },
};

const handleClose = () => {
  docStore.setModalContent(MODAL_CONTENT.NULL);
};

onMounted(() => {
  if (modalRef.value) {
    modalRef.value.focus();
  }
});
</script>

<template>
  <div
    ref="modalRef"
    class="fixed top-0 left-0 right-0 bottom-0 p-4 flex bg-white bg-opacity-80 z-50 overflow-auto"
    tabindex="-1"
    @click="handleClose"
  >
    <div
      class="w-5/6 rounded-md max-w-[600px] p-4 m-auto h-fit max-h-[max(90%,_500px)] bg-primary flex flex-col shadow-[0_0_40px_10px_rgba(0,0,0,0.5)]"
      @click.stop
    >
      <h2 class="text-center mb-4 text-2xl font-extrabold text-secondary">
        {{ $t(docStore.modalContent) }}
      </h2>

      <!-- Dynamic content rendering -->
      <component :is="modalHolder[docStore.modalContent]?.content" />

      <!-- Action buttons -->
      <div class="flex justify-end items-center mt-4 gap-4">
        <button
          v-if="
            modalHolder[docStore.modalContent]?.func &&
            modalHolder[docStore.modalContent]?.label
          "
          class="text-white text-lg p-2 py-1 rounded-md text-blue-light hover:bg-transparent bg-secondary duration-200 font-extrabold"
          @click="modalHolder[docStore.modalContent]?.func"
        >
          {{ $t(modalHolder[docStore.modalContent]?.label!) }}
        </button>
        <button
          class="hover:underline text-[15px] text-white"
          @click="handleClose"
        >
          {{ $t('close') }}
        </button>
      </div>
    </div>
  </div>
</template>
