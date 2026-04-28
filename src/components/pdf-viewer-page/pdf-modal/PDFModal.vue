<script setup lang="ts">
import { MODAL_CONTENT } from '@/assets/utils/enums';
import { ref, onMounted } from 'vue';
import { Citation, QRCode } from './items';
import { useDocumentStore, useViewerStore } from '@/stores';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const modalRef = ref<HTMLDivElement | null>(null);

const modalHolder: {
  [key in MODAL_CONTENT]: {
    content?: any;
    label?: string;
    title?: string;
    func?: () => void;
  } | null;
} = {
  [MODAL_CONTENT.NULL]: null,
  [MODAL_CONTENT.TOC]: null,
  [MODAL_CONTENT.CITATE]: {
    content: Citation,
    title: 'citation',
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
    title: 'qr-code',
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
  if (modalRef.value) modalRef.value.focus();
});
</script>

<template>
  <!-- Backdrop -->
  <div
    ref="modalRef"
    class="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4"
    tabindex="-1"
    @click="handleClose"
  >
    <!-- Modal card -->
    <div
      class="relative w-full max-w-lg bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
      @click.stop
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
        <h2 class="text-base font-bold text-gray-900 dark:text-white">
          {{ $t(modalHolder[docStore.modalContent]?.title ?? docStore.modalContent) }}
        </h2>
        <button
          @click="handleClose"
          class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <svg class="size-4" viewBox="0 0 20 20" fill="none">
            <path d="M4.5 4.5L15.5 15.5M15.5 4.5L4.5 15.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto px-6 py-4">
        <component :is="modalHolder[docStore.modalContent]?.content" />
      </div>

      <!-- Footer actions -->
      <div
        v-if="modalHolder[docStore.modalContent]?.func && modalHolder[docStore.modalContent]?.label"
        class="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/10 shrink-0"
      >
        <button
          @click="handleClose"
          class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          {{ $t('close') }}
        </button>
        <button
          class="px-5 py-2 bg-secondary hover:bg-secondary/80 text-white text-sm font-semibold rounded-lg transition-colors"
          @click="modalHolder[docStore.modalContent]?.func"
        >
          {{ $t(modalHolder[docStore.modalContent]?.label!) }}
        </button>
      </div>
    </div>
  </div>
</template>
