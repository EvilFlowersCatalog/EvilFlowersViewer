<script setup lang="ts">
import { MODAL_CONTENT, SIDEBAR_STATE } from '@/assets/utils/enums';
import ToolTip from '@/components/pdf-aids/ToolTip.vue';
import { useDocumentStore, useViewerStore } from '@/stores';
import { toRaw, computed } from 'vue';
import { AnFilledPrinter } from '@kalimahapps/vue-icons';
import sunSvg from '@/assets/icons/sun.svg?raw';
import moonSvg from '@/assets/icons/moon.svg?raw';
import pencilOnSvg from '@/assets/icons/pencil-on.svg?raw';
import pencilOffSvg from '@/assets/icons/pencil-off.svg?raw';

const props = defineProps<{ isDark: boolean; topbarBg?: string }>();
const emit = defineEmits<{ (e: 'toggleDark'): void }>();

const docStore = useDocumentStore();
const viewerStore = useViewerStore();

const download = () => {
  const link = document.createElement('a');
  const doc = toRaw(docStore.pdf);
  if (doc) {
    doc.getData().then((data) => {
      const blob = new Blob([data as BlobPart], { type: 'application/pdf' });
      link.href = URL.createObjectURL(blob);
      link.download = 'Document';
      link.click();
    });
  }
};

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    const pdfViewer = document.documentElement as any;
    const requestFullscreen =
      pdfViewer.requestFullscreen ||
      pdfViewer.webkitRequestFullscreen ||
      pdfViewer.msRequestFullscreen;
    if (requestFullscreen) requestFullscreen.call(pdfViewer);
  } else {
    const doc = document as any;
    const requestExitFullscreen =
      doc.exitFullscreen || doc.webkitExitFullscreen || doc.msExitFullscreen;
    if (requestExitFullscreen) requestExitFullscreen.call(doc);
  }
};

// The store already treats re-selecting the open panel as "close".
const toggleSidebar = (state: SIDEBAR_STATE) => docStore.setSidebarState(state);

const inactiveBtn = computed(() =>
  props.isDark
    ? 'text-white/70 hover:text-white hover:bg-white/10'
    : 'text-gray-500 hover:text-gray-900 hover:bg-black/5'
);

const btnClass = (active: boolean) => {
  const base = 'w-8 h-8 flex items-center justify-center rounded transition-colors';
  return active ? `${base} text-secondary` : `${base} ${inactiveBtn.value}`;
};
</script>

<template>
  <div
    class="flex flex-col items-center w-12 py-1.5 shrink-0 z-30 gap-0.5 overflow-y-auto"
    :class="isDark ? 'border-r border-white/5' : 'border-r border-black/5'"
    :style="{ backgroundColor: props.topbarBg ?? '#2C2C2C' }"
    role="toolbar"
    aria-orientation="vertical"
    :aria-label="$t('toolbar')"
  >

    <ToolTip v-if="viewerStore.homeFunction" position="right" :text="$t('home')">
      <button @click="viewerStore.homeFunction" :class="btnClass(false)" :aria-label="$t('home')">
        <svg class="icon" viewBox="0 0 17 19" fill="none">
          <path d="M5.75 17.4167V9.08333H10.75V17.4167M0.75 6.58333L8.25 0.75L15.75 6.58333V15.75C15.75 16.192 15.5744 16.616 15.2618 16.9285C14.9493 17.2411 14.5254 17.4167 14.0833 17.4167H2.41667C1.97464 17.4167 1.55072 17.2411 1.23816 16.9285C0.925595 16.616 0.75 16.192 0.75 15.75V6.58333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip position="right" :text="$t('search')">
      <button @click="toggleSidebar(SIDEBAR_STATE.SEARCH)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.SEARCH)" :aria-label="$t('search')" :aria-expanded="docStore.sidebarState === SIDEBAR_STATE.SEARCH">
        <svg class="icon" viewBox="0 0 16 16" fill="none">
          <path d="M6.66667 13.3333C8.14581 13.333 9.58234 12.8379 10.7475 11.9267L14.4108 15.59L15.5892 14.4117L11.9258 10.7483C12.8375 9.58305 13.333 8.1462 13.3333 6.66667C13.3333 2.99083 10.3425 0 6.66667 0C2.99083 0 0 2.99083 0 6.66667C0 10.3425 2.99083 13.3333 6.66667 13.3333ZM6.66667 1.66667C9.42417 1.66667 11.6667 3.90917 11.6667 6.66667C11.6667 9.42417 9.42417 11.6667 6.66667 11.6667C3.90917 11.6667 1.66667 9.42417 1.66667 6.66667C1.66667 3.90917 3.90917 1.66667 6.66667 1.66667Z" fill="currentColor"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip v-if="docStore.toc.length > 0" position="right" :text="$t('table-of-content')">
      <button @click="toggleSidebar(SIDEBAR_STATE.TOC)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.TOC)" :aria-label="$t('table-of-content')" :aria-expanded="docStore.sidebarState === SIDEBAR_STATE.TOC">
        <svg class="icon" viewBox="0 0 19 15" fill="none">
          <path d="M17.8971 0.25V2.60294H4.95588V0.25H17.8971ZM4.95588 8.48529H17.8971V6.13235H4.95588V8.48529ZM4.95588 14.3676H17.8971V12.0147H4.95588V14.3676ZM1.42647 0.25C0.777059 0.25 0.25 0.775882 0.25 1.42647C0.25 2.07706 0.777059 2.60294 1.42647 2.60294C2.07588 2.60294 2.60294 2.07706 2.60294 1.42647C2.60294 0.775882 2.07588 0.25 1.42647 0.25ZM1.42647 6.13235C0.777059 6.13235 0.25 6.65824 0.25 7.30882C0.25 7.95941 0.777059 8.48529 1.42647 8.48529C2.07588 8.48529 2.60294 7.95941 2.60294 7.30882C2.60294 6.65824 2.07588 6.13235 1.42647 6.13235ZM1.42647 12.0147C0.777059 12.0147 0.25 12.5406 0.25 13.1912C0.25 13.8418 0.777059 14.3676 1.42647 14.3676C2.07588 14.3676 2.60294 13.8418 2.60294 13.1912C2.60294 12.5406 2.07588 12.0147 1.42647 12.0147Z" fill="currentColor" stroke="currentColor" stroke-width="0.3"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.config.edit && viewerStore.editPackage" position="right" :text="docStore.edit ? $t('edit-disable') : $t('edit-enable')">
      <button @click="docStore.edit = !docStore.edit" :class="btnClass(docStore.edit)" :aria-label="docStore.edit ? $t('edit-disable') : $t('edit-enable')" :aria-pressed="docStore.edit">
        <span class="icon block" v-html="docStore.edit ? pencilOnSvg : pencilOffSvg" />
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.citation" position="right" :text="$t('citation')">
      <button @click="docStore.setModalContent(MODAL_CONTENT.CITATE)" :class="btnClass(false)" :aria-label="$t('citation')" aria-haspopup="dialog">
        <svg class="icon" viewBox="0 0 20 20" fill="none">
          <path d="M16.1806 5.56568C17.0391 6.47706 17.5001 7.49992 17.5001 9.158C17.5001 12.0742 15.453 14.6885 12.4746 15.9806L11.7307 14.8326C14.5101 13.3288 15.0532 11.3782 15.2704 10.1483C14.8229 10.3797 14.2371 10.461 13.6628 10.4078C12.1592 10.2684 10.9741 9.034 10.9741 7.49992C10.9741 5.88909 12.2799 4.58325 13.8907 4.58325C14.785 4.58325 15.6401 4.99196 16.1806 5.56568ZM7.84724 5.56568C8.70575 6.47706 9.16675 7.49992 9.16675 9.158C9.16675 12.0742 7.11966 14.6885 4.14126 15.9806L3.39735 14.8326C6.17672 13.3288 6.71993 11.3782 6.93706 10.1483C6.48956 10.3797 5.90377 10.461 5.32949 10.4078C3.82585 10.2684 2.64079 9.034 2.64079 7.49992C2.64079 5.88909 3.94662 4.58325 5.55746 4.58325C6.45167 4.58325 7.30678 4.99196 7.84724 5.56568Z" fill="currentColor"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.shareFunction && viewerStore.config.share" position="right" :text="$t('share')">
      <button @click="toggleSidebar(SIDEBAR_STATE.SHARE)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.SHARE)" :aria-label="$t('share')" :aria-expanded="docStore.sidebarState === SIDEBAR_STATE.SHARE">
        <svg class="icon" viewBox="0 0 20 20" fill="none">
          <path d="M15 6.66675C16.3807 6.66675 17.5 5.54746 17.5 4.16675C17.5 2.78604 16.3807 1.66675 15 1.66675C13.6193 1.66675 12.5 2.78604 12.5 4.16675C12.5 5.54746 13.6193 6.66675 15 6.66675Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5 12.5C6.38071 12.5 7.5 11.3807 7.5 10C7.5 8.61929 6.38071 7.5 5 7.5C3.61929 7.5 2.5 8.61929 2.5 10C2.5 11.3807 3.61929 12.5 5 12.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M15 18.3333C16.3807 18.3333 17.5 17.214 17.5 15.8333C17.5 14.4525 16.3807 13.3333 15 13.3333C13.6193 13.3333 12.5 14.4525 12.5 15.8333C12.5 17.214 13.6193 18.3333 15 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M7.15833 11.2583L12.85 14.575" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12.8417 5.42505L7.15833 8.74172" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip position="right" :text="$t('info')">
      <button @click="toggleSidebar(SIDEBAR_STATE.INFO)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.INFO)" :aria-label="$t('info')" :aria-expanded="docStore.sidebarState === SIDEBAR_STATE.INFO">
        <svg class="icon" viewBox="0 0 20 20" fill="none">
          <path d="M10 1.25C5.16797 1.25 1.25 5.16797 1.25 10C1.25 14.832 5.16797 18.75 10 18.75C14.832 18.75 18.75 14.832 18.75 10C18.75 5.16797 14.832 1.25 10 1.25ZM10 17.2656C5.98828 17.2656 2.73438 14.0117 2.73438 10C2.73438 5.98828 5.98828 2.73438 10 2.73438C14.0117 2.73438 17.2656 5.98828 17.2656 10C17.2656 14.0117 14.0117 17.2656 10 17.2656Z" fill="currentColor"/>
          <path d="M9.0625 6.5625C9.0625 6.81114 9.16127 7.0496 9.33709 7.22541C9.5129 7.40123 9.75136 7.5 10 7.5C10.2486 7.5 10.4871 7.40123 10.6629 7.22541C10.8387 7.0496 10.9375 6.81114 10.9375 6.5625C10.9375 6.31386 10.8387 6.0754 10.6629 5.89959C10.4871 5.72377 10.2486 5.625 10 5.625C9.75136 5.625 9.5129 5.72377 9.33709 5.89959C9.16127 6.0754 9.0625 6.31386 9.0625 6.5625ZM10.4688 8.75H9.53125C9.44531 8.75 9.375 8.82031 9.375 8.90625V14.2188C9.375 14.3047 9.44531 14.375 9.53125 14.375H10.4688C10.5547 14.375 10.625 14.3047 10.625 14.2188V8.90625C10.625 8.82031 10.5547 8.75 10.4688 8.75Z" fill="currentColor"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.config.print && viewerStore.printFunction" position="right" :text="$t('print')">
      <button @click="toggleSidebar(SIDEBAR_STATE.PRINT)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.PRINT)" :aria-label="$t('print')" :aria-expanded="docStore.sidebarState === SIDEBAR_STATE.PRINT">
        <AnFilledPrinter class="icon" />
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.config.download" position="right" :text="$t('download')">
      <button @click="download" :class="btnClass(false)" :aria-label="$t('download')">
        <svg class="icon" viewBox="0 0 20 20" fill="none">
          <path d="M17.5 12.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V12.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5.83333 8.33325L10 12.4999L14.1667 8.33325" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 12.5V2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip position="right" :text="isDark ? $t('light-mode') : $t('dark-mode')">
      <button @click="$emit('toggleDark')" :class="btnClass(false)" :aria-label="isDark ? $t('light-mode') : $t('dark-mode')" :aria-pressed="isDark">
        <span class="icon block" v-html="isDark ? sunSvg : moonSvg" />
      </button>
    </ToolTip>

    <ToolTip position="right" :text="!docStore.isFullscreenMode ? $t('fullscreen-enable') : $t('fullscreen-disable')">
      <button @click="toggleFullScreen" :class="btnClass(false)" :aria-label="!docStore.isFullscreenMode ? $t('fullscreen-enable') : $t('fullscreen-disable')" :aria-pressed="docStore.isFullscreenMode">
        <svg v-if="!docStore.isFullscreenMode" class="size-4" viewBox="0 0 20 20" fill="none">
          <path d="M13.3333 2.5H18.3333V7.5H16.6667V4.16667H13.3333V2.5ZM1.66667 2.5H6.66667V4.16667H3.33333V7.5H1.66667V2.5ZM16.6667 15.8333V12.5H18.3333V17.5H13.3333V15.8333H16.6667ZM3.33333 15.8333H6.66667V17.5H1.66667V12.5H3.33333V15.8333Z" fill="currentColor"/>
        </svg>
        <svg v-else class="size-4" viewBox="0 0 20 20" fill="none">
          <path d="M7.5 2.5V7.5H2.5V5.83333H5.83333V2.5H7.5ZM12.5 2.5H14.1667V5.83333H17.5V7.5H12.5V2.5ZM2.5 12.5H7.5V17.5H5.83333V14.1667H2.5V12.5ZM14.1667 14.1667V17.5H12.5V12.5H17.5V14.1667H14.1667Z" fill="currentColor"/>
        </svg>
      </button>
    </ToolTip>

  </div>
</template>
