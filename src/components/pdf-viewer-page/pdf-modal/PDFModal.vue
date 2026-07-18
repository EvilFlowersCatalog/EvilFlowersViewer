<script setup lang="ts">
import { MODAL_CONTENT } from '@/assets/utils/enums';
import { ref, onMounted, useId } from 'vue';
import { Citation, QRCode } from './items';
import { useDocumentStore, useViewerStore } from '@/stores';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const modalRef = ref<HTMLDivElement | null>(null);
const cardRef = ref<HTMLDivElement | null>(null);
// Unique per instance (Vue 3.5) so aria-labelledby never collides between
// several viewers on one page.
const titleId = useId();

// Keep Tab focus inside the dialog while it is open.
const trapFocus = (event: KeyboardEvent) => {
  if (event.key !== 'Tab' || !cardRef.value) return;
  const focusables = cardRef.value.querySelectorAll<HTMLElement>(
    'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
  );
  if (focusables.length === 0) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

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
      // Scope the lookup to this modal's own DOM so multiple viewers never
      // collide on a shared element id.
      const canvas = modalRef.value?.querySelector('canvas');
      if (canvas) {
        const pngUrl = canvas
          .toDataURL('image/png')
          .replace('image/png', 'image/octet-stream');
        const downloadLink = document.createElement('a');
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
  if (cardRef.value) cardRef.value.focus();
});
</script>

<template>
  <!-- Backdrop -->
  <div
    ref="modalRef"
    class="fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm p-4"
    @click="handleClose"
  >
    <!-- Modal card -->
    <div
      ref="cardRef"
      class="relative w-full max-w-lg bg-white dark:bg-[#1E1E1E] rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      @click.stop
      @keydown="trapFocus"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/10 shrink-0">
        <h2 :id="titleId" class="text-base font-bold text-gray-900 dark:text-white">
          {{ $t(modalHolder[docStore.modalContent]?.title ?? docStore.modalContent) }}
        </h2>
        <button
          @click="handleClose"
          :aria-label="$t('close')"
          class="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-200 transition-colors p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10"
        >
          <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="none">
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
