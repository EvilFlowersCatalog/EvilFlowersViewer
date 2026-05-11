<script setup lang="ts">
import { MODAL_CONTENT, SIDEBAR_STATE } from '@/assets/utils/enums';
import ToolTip from '@/components/pdf-aids/ToolTip.vue';
import { useDocumentStore, useViewerStore } from '@/stores';
import { toRaw, computed } from 'vue';
import { AnFilledPrinter } from '@kalimahapps/vue-icons';

const props = defineProps<{ isDark: boolean; topbarBg?: string }>();
const emit = defineEmits<{ (e: 'toggleDark'): void }>();

const docStore = useDocumentStore();
const viewerStore = useViewerStore();

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

const toggleSidebar = (state: SIDEBAR_STATE) => {
  docStore.setSidebarState(
    docStore.sidebarState === state ? SIDEBAR_STATE.NULL : state
  );
};

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
  >

    <ToolTip v-if="viewerStore.homeFunction" position="right" :text="$t('home')">
      <button @click="viewerStore.homeFunction" :class="btnClass(false)">
        <svg class="icon" viewBox="0 0 17 19" fill="none">
          <path d="M5.75 17.4167V9.08333H10.75V17.4167M0.75 6.58333L8.25 0.75L15.75 6.58333V15.75C15.75 16.192 15.5744 16.616 15.2618 16.9285C14.9493 17.2411 14.5254 17.4167 14.0833 17.4167H2.41667C1.97464 17.4167 1.55072 17.2411 1.23816 16.9285C0.925595 16.616 0.75 16.192 0.75 15.75V6.58333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip position="right" :text="$t('search')">
      <button @click="toggleSidebar(SIDEBAR_STATE.SEARCH)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.SEARCH)">
        <svg class="icon" viewBox="0 0 16 16" fill="none">
          <path d="M6.66667 13.3333C8.14581 13.333 9.58234 12.8379 10.7475 11.9267L14.4108 15.59L15.5892 14.4117L11.9258 10.7483C12.8375 9.58305 13.333 8.1462 13.3333 6.66667C13.3333 2.99083 10.3425 0 6.66667 0C2.99083 0 0 2.99083 0 6.66667C0 10.3425 2.99083 13.3333 6.66667 13.3333ZM6.66667 1.66667C9.42417 1.66667 11.6667 3.90917 11.6667 6.66667C11.6667 9.42417 9.42417 11.6667 6.66667 11.6667C3.90917 11.6667 1.66667 9.42417 1.66667 6.66667C1.66667 3.90917 3.90917 1.66667 6.66667 1.66667Z" fill="currentColor"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip v-if="docStore.toc.length > 0" position="right" :text="$t('table-of-content')">
      <button @click="toggleSidebar(SIDEBAR_STATE.TOC)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.TOC)">
        <svg class="icon" viewBox="0 0 19 15" fill="none">
          <path d="M17.8971 0.25V2.60294H4.95588V0.25H17.8971ZM4.95588 8.48529H17.8971V6.13235H4.95588V8.48529ZM4.95588 14.3676H17.8971V12.0147H4.95588V14.3676ZM1.42647 0.25C0.777059 0.25 0.25 0.775882 0.25 1.42647C0.25 2.07706 0.777059 2.60294 1.42647 2.60294C2.07588 2.60294 2.60294 2.07706 2.60294 1.42647C2.60294 0.775882 2.07588 0.25 1.42647 0.25ZM1.42647 6.13235C0.777059 6.13235 0.25 6.65824 0.25 7.30882C0.25 7.95941 0.777059 8.48529 1.42647 8.48529C2.07588 8.48529 2.60294 7.95941 2.60294 7.30882C2.60294 6.65824 2.07588 6.13235 1.42647 6.13235ZM1.42647 12.0147C0.777059 12.0147 0.25 12.5406 0.25 13.1912C0.25 13.8418 0.777059 14.3676 1.42647 14.3676C2.07588 14.3676 2.60294 13.8418 2.60294 13.1912C2.60294 12.5406 2.07588 12.0147 1.42647 12.0147Z" fill="currentColor" stroke="currentColor" stroke-width="0.3"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.config.edit && viewerStore.editPackage" position="right" :text="docStore.edit ? $t('edit-disable') : $t('edit-enable')">
      <button @click="docStore.edit ? docStore.setEdit(false) : docStore.setEdit(true)" :class="btnClass(docStore.edit)">
        <svg class="icon" viewBox="0 0 20 20" fill="none">
          <path d="M18.8331 0.969942C18.1522 0.317441 17.401 -0.0131836 16.5992 -0.0131836C15.3454 -0.0131836 14.4307 0.796817 14.1804 1.04494C13.8282 1.39369 1.81414 13.4121 1.81414 13.4121C1.7354 13.4912 1.67856 13.5895 1.64916 13.6971C1.37822 14.6984 0.0210351 19.1409 0.0075585 19.1856C-0.0621095 19.4131 5.8502e-05 19.6609 0.167871 19.8287C0.286248 19.9468 0.446605 20.0131 0.613789 20.0131C0.678476 20.0131 0.743769 20.0034 0.807519 19.9824C0.853457 19.9674 5.43908 18.4853 6.19375 18.26C6.29332 18.2299 6.38407 18.1761 6.45812 18.1031C6.935 17.6318 18.1403 6.55119 18.8841 5.78307C19.6534 4.99025 20.0356 4.16463 20.0209 3.32963C20.0056 2.50525 19.6059 1.7115 18.8331 0.969942ZM2.74199 14.4912C3.08543 14.5824 3.79885 14.8471 4.52605 15.5802C5.08605 16.1449 5.35043 16.7677 5.46918 17.1474C4.60043 17.4268 2.69824 18.0833 1.48949 18.473C1.84762 17.2946 2.4526 15.4593 2.74199 14.4912Z" fill="currentColor"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.citation" position="right" :text="$t('citation')">
      <button @click="docStore.setModalContent(MODAL_CONTENT.CITATE)" :class="btnClass(false)">
        <svg class="icon" viewBox="0 0 20 20" fill="none">
          <path d="M16.1806 5.56568C17.0391 6.47706 17.5001 7.49992 17.5001 9.158C17.5001 12.0742 15.453 14.6885 12.4746 15.9806L11.7307 14.8326C14.5101 13.3288 15.0532 11.3782 15.2704 10.1483C14.8229 10.3797 14.2371 10.461 13.6628 10.4078C12.1592 10.2684 10.9741 9.034 10.9741 7.49992C10.9741 5.88909 12.2799 4.58325 13.8907 4.58325C14.785 4.58325 15.6401 4.99196 16.1806 5.56568ZM7.84724 5.56568C8.70575 6.47706 9.16675 7.49992 9.16675 9.158C9.16675 12.0742 7.11966 14.6885 4.14126 15.9806L3.39735 14.8326C6.17672 13.3288 6.71993 11.3782 6.93706 10.1483C6.48956 10.3797 5.90377 10.461 5.32949 10.4078C3.82585 10.2684 2.64079 9.034 2.64079 7.49992C2.64079 5.88909 3.94662 4.58325 5.55746 4.58325C6.45167 4.58325 7.30678 4.99196 7.84724 5.56568Z" fill="currentColor"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.shareFunction && viewerStore.config.share" position="right" :text="$t('share')">
      <button @click="toggleSidebar(SIDEBAR_STATE.SHARE)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.SHARE)">
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
      <button @click="toggleSidebar(SIDEBAR_STATE.INFO)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.INFO)">
        <svg class="icon" viewBox="0 0 20 20" fill="none">
          <path d="M10 1.25C5.16797 1.25 1.25 5.16797 1.25 10C1.25 14.832 5.16797 18.75 10 18.75C14.832 18.75 18.75 14.832 18.75 10C18.75 5.16797 14.832 1.25 10 1.25ZM10 17.2656C5.98828 17.2656 2.73438 14.0117 2.73438 10C2.73438 5.98828 5.98828 2.73438 10 2.73438C14.0117 2.73438 17.2656 5.98828 17.2656 10C17.2656 14.0117 14.0117 17.2656 10 17.2656Z" fill="currentColor"/>
          <path d="M9.0625 6.5625C9.0625 6.81114 9.16127 7.0496 9.33709 7.22541C9.5129 7.40123 9.75136 7.5 10 7.5C10.2486 7.5 10.4871 7.40123 10.6629 7.22541C10.8387 7.0496 10.9375 6.81114 10.9375 6.5625C10.9375 6.31386 10.8387 6.0754 10.6629 5.89959C10.4871 5.72377 10.2486 5.625 10 5.625C9.75136 5.625 9.5129 5.72377 9.33709 5.89959C9.16127 6.0754 9.0625 6.31386 9.0625 6.5625ZM10.4688 8.75H9.53125C9.44531 8.75 9.375 8.82031 9.375 8.90625V14.2188C9.375 14.3047 9.44531 14.375 9.53125 14.375H10.4688C10.5547 14.375 10.625 14.3047 10.625 14.2188V8.90625C10.625 8.82031 10.5547 8.75 10.4688 8.75Z" fill="currentColor"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.config.print && viewerStore.printFunction" position="right" :text="$t('print')">
      <button @click="toggleSidebar(SIDEBAR_STATE.PRINT)" :class="btnClass(docStore.sidebarState === SIDEBAR_STATE.PRINT)">
        <AnFilledPrinter class="icon" />
      </button>
    </ToolTip>

    <ToolTip v-if="viewerStore.config.download" position="right" :text="$t('download')">
      <button @click="download" :class="btnClass(false)">
        <svg class="icon" viewBox="0 0 20 20" fill="none">
          <path d="M17.5 12.5V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V12.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M5.83333 8.33325L10 12.4999L14.1667 8.33325" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M10 12.5V2.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip position="right" :text="isDark ? 'Light mode' : 'Dark mode'">
      <button @click="$emit('toggleDark')" :class="btnClass(false)">
        <svg v-if="isDark" class="icon" viewBox="0 0 20 20" fill="none">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M10.7232 16.1473V18.6786C10.7232 18.8561 10.5793 19 10.4018 19H9.59821C9.42068 19 9.27679 18.8561 9.27679 18.6786V16.1473C9.5951 16.1803 9.83617 16.1968 10 16.1968C10.1638 16.1968 10.4049 16.1803 10.7232 16.1473ZM14.8466 13.8238L16.6364 15.6136C16.762 15.7392 16.762 15.9427 16.6364 16.0682L16.0682 16.6364C15.9427 16.762 15.7392 16.762 15.6136 16.6364L13.8238 14.8465C14.0722 14.6448 14.2543 14.486 14.3702 14.3702C14.486 14.2543 14.6448 14.0722 14.8466 13.8238M5.15344 13.8238C5.3552 14.0722 5.51398 14.2543 5.62982 14.3702C5.74567 14.486 5.9278 14.6448 6.17621 14.8465L4.38635 16.6364C4.26083 16.7619 4.05729 16.7619 3.93179 16.6364L3.36356 16.0682C3.23805 15.9427 3.23805 15.7391 3.36356 15.6136L5.15344 13.8238ZM10 5.29911C12.5962 5.29911 14.7009 7.40376 14.7009 10C14.7009 12.5962 12.5962 14.7009 10 14.7009C7.40376 14.7009 5.29911 12.5962 5.29911 10C5.29911 7.40376 7.40376 5.29911 10 5.29911ZM10 6.74554C8.20261 6.74554 6.74554 8.20261 6.74554 10C6.74554 11.7974 8.20261 13.2545 10 13.2545C11.7974 13.2545 13.2545 11.7974 13.2545 10C13.2545 8.20261 11.7974 6.74554 10 6.74554ZM3.85268 9.27679C3.81967 9.5951 3.80318 9.83617 3.80318 10C3.80318 10.1638 3.81967 10.4049 3.85268 10.7232H1.32143C1.1439 10.7232 1 10.5793 1 10.4018V9.59821C1 9.42068 1.1439 9.27679 1.32143 9.27679H3.85268ZM18.6786 9.27679C18.8561 9.27679 19 9.42068 19 9.59821V10.4018C19 10.5793 18.8561 10.7232 18.6786 10.7232H16.1473C16.1803 10.4049 16.1968 10.1638 16.1968 10C16.1968 9.83617 16.1803 9.5951 16.1473 9.27679H18.6786ZM16.0682 3.34348L16.6364 3.9117C16.762 4.03722 16.762 4.24074 16.6364 4.36626L14.8465 6.15612C14.6448 5.90771 14.486 5.72558 14.3702 5.60973C14.2543 5.49389 14.0722 5.33511 13.8238 5.13335L15.6136 3.34348C15.7391 3.21796 15.9427 3.21796 16.0682 3.34348M4.38633 3.34348L6.17619 5.13335C5.92778 5.33511 5.74565 5.49389 5.6298 5.60973C5.51396 5.72558 5.35518 5.90771 5.15342 6.15612L3.36354 4.36626C3.23803 4.24074 3.23803 4.0372 3.36354 3.9117L3.93177 3.34348C4.05729 3.21796 4.26081 3.21796 4.38633 3.34348ZM10.4018 1C10.5793 1 10.7232 1.1439 10.7232 1.32143V3.85268C10.4049 3.81967 10.1638 3.80318 10 3.80318C9.83617 3.80318 9.5951 3.81967 9.27679 3.85268V1.32143C9.27679 1.1439 9.42068 1 9.59821 1H10.4018Z" fill="currentColor"/>
        </svg>
        <svg v-else class="icon" viewBox="0 0 20 20" fill="none">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" fill="currentColor"/>
        </svg>
      </button>
    </ToolTip>

    <ToolTip position="right" :text="!docStore.isFullscreenMode ? $t('fullscreen-enable') : $t('fullscreen-disable')">
      <button @click="toggleFullScreen" :class="btnClass(false)">
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
