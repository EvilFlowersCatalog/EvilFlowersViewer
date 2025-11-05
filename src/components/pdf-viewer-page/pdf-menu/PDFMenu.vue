<script setup lang="ts">
import { MODAL_CONTENT, SIDEBAR_STATE } from '@/assets/utils/enums';
import ToolTip from '@/components/pdf-aids/ToolTip.vue';
import { useDocumentStore, useViewerStore } from '@/stores';
import {
  IcSolidDownloadSquare,
  AnFilledPrinter,
  AnFilledInfoCircle,
  McShareForwardFill,
  BxSolidQuoteAltRight,
  BxSolidSearch,
  AnFilledCloseCircle,
  AnFilledHome,
  McMenuFill,
  ReFullscreenFill,
  ReFullscreenExitFill,
  FlFilledEditOff,
  FlFilledEdit,
} from '@kalimahapps/vue-icons';
import { toRaw } from 'vue';

// Data
const docStore = useDocumentStore();
const viewerStore = useViewerStore();

// Download document
const download = () => {
  const link = document.createElement('a');
  const doc = toRaw(docStore.pdf);
  if (doc) {
    doc.getData().then((data) => {
      const blob = new Blob([data], { type: 'application/pdf' });
      link.href = URL.createObjectURL(blob);
      link.download = 'Document';
      link.click();
    });
  }
};

// Handle fullscreen toggle
const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    const pdfViewer = document.documentElement as any;

    // List of possible fullscreen methods
    const requestFullscreen =
      pdfViewer.requestFullscreen ||
      pdfViewer.webkitRequestFullscreen ||
      pdfViewer.msRequestFullscreen;

    // If exist, call the method dynamicly
    if (requestFullscreen) {
      requestFullscreen.call(pdfViewer);
    }
  } else {
    const doc = document as any;

    // List of possible methods
    const requestExitFullscreen =
      doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    // Call the method dynamically
    if (requestExitFullscreen) {
      requestExitFullscreen.call(doc);
    }
  }
};
</script>

<template>
  <div class="h-full bg-primary p-2 overflow-y-auto overflow-x-hidden z-20">
    <div class="flex flex-col gap-3">
      <!-- Close -->
      <ToolTip
        v-if="viewerStore.closeFunction"
        position="right"
        :text="$t('close')"
      >
        <button
          @click="viewerStore.closeFunction"
          class="relative flex justify-center items-center"
        >
          <div class="absolute bg-white w-3 h-3 -z-10"></div>
          <AnFilledCloseCircle class="icon text-secondary" />
        </button>
      </ToolTip>

      <!-- Home -->
      <ToolTip
        v-if="viewerStore.homeFunction"
        position="right"
        :text="$t('home')"
      >
        <button @click="viewerStore.homeFunction">
          <AnFilledHome class="icon hover:text-secondary" />
        </button>
      </ToolTip>

      <!-- Edit -->
      <ToolTip
        v-if="viewerStore.config.edit && viewerStore.editPackage"
        position="right"
        :text="docStore.edit ? $t('edit-disable') : $t('edit-enable')"
      >
        <button v-if="docStore.edit" @click="docStore.setEdit(false)">
          <FlFilledEditOff class="icon hover:text-secondary" />
        </button>
        <button v-else @click="docStore.setEdit(true)">
          <FlFilledEdit class="icon hover:text-secondary" />
        </button>
      </ToolTip>

      <!-- Search -->
      <ToolTip position="right" :text="$t('search')">
        <button @click="docStore.setSidebarState(SIDEBAR_STATE.SEARCH)">
          <BxSolidSearch class="icon hover:text-secondary" />
        </button>
      </ToolTip>

      <!-- Table of contents -->
      <ToolTip
        v-if="docStore.toc.length > 0"
        position="right"
        :text="$t('table-of-content')"
      >
        <button @click="docStore.setModalContent(MODAL_CONTENT.TOC)">
          <McMenuFill class="icon hover:text-secondary" />
        </button>
      </ToolTip>

      <!-- Citate -->
      <ToolTip
        v-if="viewerStore.citation"
        position="right"
        :text="$t('citation')"
      >
        <button @click="docStore.setModalContent(MODAL_CONTENT.CITATE)">
          <BxSolidQuoteAltRight class="icon hover:text-secondary" />
        </button>
      </ToolTip>

      <!-- Share -->
      <ToolTip
        v-if="viewerStore.shareFunction && viewerStore.config.share"
        position="right"
        :text="$t('share')"
      >
        <button @click="docStore.setSidebarState(SIDEBAR_STATE.SHARE)">
          <McShareForwardFill class="icon hover:text-secondary" />
        </button>
      </ToolTip>

      <!-- Info -->
      <ToolTip position="right" :text="$t('info')">
        <button @click="docStore.setSidebarState(SIDEBAR_STATE.INFO)">
          <AnFilledInfoCircle class="icon hover:text-secondary" />
        </button>
      </ToolTip>

      <!-- Print -->
      <ToolTip
        v-if="viewerStore.config.print && viewerStore.printFunction"
        position="right"
        :text="$t('print')"
      >
        <button @click="docStore.setSidebarState(SIDEBAR_STATE.PRINT)">
          <AnFilledPrinter class="icon hover:text-secondary" />
        </button>
      </ToolTip>

      <!-- Download -->
      <ToolTip
        v-if="viewerStore.config.download"
        position="right"
        :text="$t('download')"
      >
        <button @click="download">
          <IcSolidDownloadSquare class="icon hover:text-secondary" />
        </button>
      </ToolTip>

      <!-- Fullscreen -->
      <ToolTip
        position="right"
        :text="
          !docStore.isFullscreenMode
            ? $t('fullscreen-enable')
            : $t('fullscreen-disable')
        "
      >
        <button v-if="!docStore.isFullscreenMode" @click="toggleFullScreen">
          <ReFullscreenFill class="icon hover:text-secondary" />
        </button>
        <button v-else @click="toggleFullScreen">
          <ReFullscreenExitFill class="icon hover:text-secondary" />
        </button>
      </ToolTip>
    </div>
  </div>
</template>
