<script setup lang="ts">
// The one bar above the book.
//   Left    the Navigator and the book's title
//   Centre  where you are: the page box, with the book's own page labels
//   Right   find and zoom, then the actions, each visible with its shortcut;
//           an action opens its card right under its own button.
// Narrow screens fold the rarer actions into "⋯".
import { computed, inject, onBeforeUnmount, onMounted, ref, toRaw, watch, type Ref } from 'vue';
import { useAssistantStore, useDocumentStore, useSearchStore, useViewerStore } from '@/stores';
import { SIDEBAR_STATE } from '@/assets/utils/enums';
import { MAX_SCALE, MIN_SCALE } from '@/assets/utils/constans';
import { SuggestionsPopup } from './pdf-suggestions';
import { useEscapeLayer } from '../pdf-aids/useEscapeLayer';
import BarButton from './BarButton.vue';
import ActionPopover from './pdf-actions/ActionPopover.vue';
import CitePanel from './pdf-actions/CitePanel.vue';
import SharePanel from './pdf-actions/SharePanel.vue';
import PrintPanel from './pdf-actions/PrintPanel.vue';
import InfoPanel from './pdf-actions/InfoPanel.vue';

const props = defineProps<{ isDark: boolean }>();
const emit = defineEmits<{ toggleDark: []; openSearch: [] }>();

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();
const search = useSearchStore();
const topbarBg = inject<Ref<string>>('topbarBg', ref('#fff'));

// ---- title ----
const metaTitle = ref<string | null>(null);
watch(
  () => docStore.pdf,
  async (pdf) => {
    metaTitle.value = null;
    const doc = toRaw(pdf);
    if (!doc) return;
    try {
      const { info } = (await doc.getMetadata()) as { info?: { Title?: string } };
      const t = info?.Title?.trim();
      if (t && toRaw(docStore.pdf) === doc) metaTitle.value = t;
    } catch {
      // no metadata
    }
  },
  { immediate: true }
);
const title = computed(() => viewerStore.title || metaTitle.value || '');

// ---- page box ----
const hasLabels = computed(() => !!docStore.pageLabels);
const activeLabel = computed(() => docStore.pageLabel(docStore.activePage));
const pageInput = ref('');
const commitPage = (input: HTMLInputElement) => {
  const value = pageInput.value.trim();
  pageInput.value = '';
  input.value = '';
  if (!value) return;
  const page = docStore.pageForLabel(value) ?? (/^\d+$/.test(value) ? Number(value) : null);
  if (page) docStore.goTo(page, 'input');
};
const onPageKey = (event: KeyboardEvent) => {
  event.stopPropagation();
  const input = event.target as HTMLInputElement;
  if (event.key === 'Enter') {
    commitPage(input);
    input.blur();
  } else if (event.key === 'Escape') {
    pageInput.value = '';
    input.value = '';
    input.blur();
  }
};

// ---- menus and action cards (one open at a time) ----
const openMenu = ref<'more' | 'zoom' | 'suggestions' | null>(null);
const toggleMenu = (menu: 'more' | 'zoom' | 'suggestions') => {
  docStore.actionPopover = null;
  openMenu.value = openMenu.value === menu ? null : menu;
  if (openMenu.value === 'suggestions') viewerStore.events.emit('action', { action: 'recommendations' });
};
const toggleAction = (action: 'cite' | 'share' | 'print' | 'info') => {
  openMenu.value = null;
  docStore.toggleAction(action);
};
watch(
  () => docStore.actionPopover,
  (action) => action && (openMenu.value = null)
);
useEscapeLayer(
  () => openMenu.value !== null || docStore.actionPopover !== null,
  () => {
    openMenu.value = null;
    docStore.actionPopover = null;
  }
);
const root = ref<HTMLElement | null>(null);
const onDocPointer = (event: PointerEvent) => {
  if (root.value?.contains(event.target as Node)) return;
  openMenu.value = null;
  docStore.actionPopover = null;
};

// Which actions have a button of their own at this width (the rest fold
// into "⋯"); a card opens under its button, or under "⋯" when folded.
const width = ref(window.innerWidth);
const onResize = () => (width.value = window.innerWidth);
const inBar = computed(() => ({
  cite: width.value >= 640,
  share: width.value >= 640,
  print: width.value >= 1024,
  info: width.value >= 1024,
  download: width.value >= 1024,
}));
const anchoredAt = (action: 'cite' | 'share' | 'print' | 'info') =>
  inBar.value[action] ? action : 'more';

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer);
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer);
  window.removeEventListener('resize', onResize);
});

// ---- what is available ----
const can = computed(() => ({
  cite: !!viewerStore.citation,
  // The Share card holds an access share, a plain link (#155), or both.
  share: !!((viewerStore.shareFunction && viewerStore.config.share) || viewerStore.linkFunction),
  print: !!(viewerStore.config.print && viewerStore.printFunction),
  download: !!viewerStore.config.download,
  ask: !!viewerStore.chatPackage,
  draw: !!(viewerStore.config.edit && viewerStore.editPackage && !docStore.isMobile),
  suggest: !!viewerStore.suggestionsFunction,
}));

// ---- actions ----
const toggleNavigator = () => {
  docStore.sidebarState =
    docStore.sidebarState === SIDEBAR_STATE.NULL
      ? docStore.toc.length
        ? SIDEBAR_STATE.TOC
        : SIDEBAR_STATE.PAGES
      : SIDEBAR_STATE.NULL;
};

const toggleChat = () => {
  if (assistantStore.isChatOpen) assistantStore.isChatOpen = false;
  else assistantStore.openChat();
};

const download = () => {
  openMenu.value = null;
  const doc = toRaw(docStore.pdf);
  if (!doc) return;
  viewerStore.events.emit('action', { action: 'download' });
  doc.getData().then((data) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data as BlobPart], { type: 'application/pdf' }));
    link.download = `${title.value || 'document'}.pdf`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
  });
};
defineExpose({
  download,
  toggleSuggestions: () => can.value.suggest && toggleMenu('suggestions'),
});

const toggleFullScreen = () => {
  openMenu.value = null;
  const doc = document as Document & { webkitExitFullscreen?: () => void };
  if (!document.fullscreenElement) {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
  } else {
    (doc.exitFullscreen ?? doc.webkitExitFullscreen)?.call(doc);
  }
};

const zoomPercent = computed(() => `${Math.round(docStore.scale * 100)} %`);
const btnText = computed(() =>
  props.isDark
    ? 'text-white/75 hover:text-white hover:bg-white/10'
    : 'text-[#3a3a3c] hover:text-black hover:bg-black/[0.06]'
);
const divider = computed(() => (props.isDark ? 'bg-white/10' : 'bg-black/10'));
</script>

<template>
  <header
    ref="root"
    class="relative z-30 shrink-0 h-12 flex items-center gap-1 px-2 border-b"
    :class="isDark ? 'border-white/[0.06] text-white' : 'border-black/[0.06] text-[#1d1d1f]'"
    :style="{ backgroundColor: topbarBg }"
    role="toolbar"
    :aria-label="$t('toolbar')"
  >
    <!-- Left: leave, navigate, title -->
    <BarButton v-if="viewerStore.homeFunction" :label="$t('home')" @click="viewerStore.homeFunction?.()">
      <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="none"><path d="M12.5 4.5L7 10l5.5 5.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </BarButton>
    <BarButton
      :label="$t('navigator')"
      shortcut="T"
      :active="docStore.sidebarState !== SIDEBAR_STATE.NULL"
      @click="toggleNavigator"
    >
      <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="none">
        <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" stroke="currentColor" stroke-width="1.5" />
        <path d="M7.5 3.5v13" stroke="currentColor" stroke-width="1.5" />
        <path d="M4.5 7h1M4.5 9.5h1M4.5 12h1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
      </svg>
    </BarButton>
    <h1 class="hidden lg:block min-w-0 max-w-[24vw] ml-1 truncate text-[13.5px] font-semibold tracking-[-0.01em]" :title="title">
      {{ title }}
    </h1>

    <!-- Centre: where you are -->
    <div class="flex-1 min-w-0 flex items-center justify-center gap-1">
      <BarButton v-if="width >= 640" :label="$t('previous-page')" shortcut="←" @click="docStore.previousPage()">
        <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="none"><path d="M12.5 5L7.5 10l5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </BarButton>
      <label class="flex items-center gap-1.5 text-[13px] tabular-nums whitespace-nowrap">
        <input
          type="text"
          :inputmode="hasLabels ? 'text' : 'numeric'"
          class="h-7 rounded-[7px] text-center outline-none transition-colors focus:ring-2 focus:ring-[#0077cc]/70"
          :class="[hasLabels ? 'w-14' : 'w-11', isDark ? 'bg-white/10 placeholder:text-white/85' : 'bg-black/[0.05] placeholder:text-[#1d1d1f]']"
          :placeholder="activeLabel ?? String(docStore.activePage)"
          :aria-label="$t('go-to-page')"
          @input="pageInput = ($event.target as HTMLInputElement).value"
          @keydown="onPageKey"
          @blur="commitPage($event.target as HTMLInputElement)"
        />
        <span :class="isDark ? 'text-white/50' : 'text-[#6e6e73]'">
          {{ hasLabels && activeLabel !== String(docStore.activePage) ? `(${docStore.activePage}) ` : '' }}/ {{ docStore.totalPages }}
        </span>
      </label>
      <BarButton v-if="width >= 640" :label="$t('next-page')" shortcut="→" @click="docStore.nextPage()">
        <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="none"><path d="M7.5 5l5 5-5 5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" /></svg>
      </BarButton>
    </div>

    <!-- Find -->
    <button
      type="button"
      class="hidden md:flex items-center gap-2 h-8 w-[170px] xl:w-[210px] px-2.5 rounded-[8px] text-[13px] transition-colors"
      :class="isDark ? 'bg-white/[0.08] text-white/55 hover:bg-white/[0.12]' : 'bg-black/[0.05] text-[#8e8e93] hover:bg-black/[0.08]'"
      :aria-label="$t('search')"
      aria-keyshortcuts="Control+F Meta+F"
      @click="emit('openSearch')"
    >
      <svg aria-hidden="true" class="size-4 shrink-0" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.7" /><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
      <span class="truncate" :class="search.query ? (isDark ? 'text-white' : 'text-[#1d1d1f]') : ''">{{ search.query || $t('search-placeholder') }}</span>
      <kbd class="ml-auto text-[11px] opacity-70">⌘F</kbd>
    </button>
    <BarButton class="md:hidden" :label="$t('search')" shortcut="⌘F" @click="emit('openSearch')">
      <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="none"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.7" /><path d="M13 13l4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" /></svg>
    </BarButton>

    <!-- Zoom -->
    <div class="relative">
      <button
        type="button"
        class="h-8 px-2 rounded-[8px] text-[12.5px] tabular-nums font-medium transition-colors"
        :class="[btnText, openMenu === 'zoom' ? '!text-[#0077cc] bg-[#0077cc]/10' : '']"
        :aria-label="$t('zoom')"
        :aria-expanded="openMenu === 'zoom'"
        @click="toggleMenu('zoom')"
      >
        {{ zoomPercent }}
      </button>
      <div v-if="openMenu === 'zoom'" class="efv-menu right-0 w-[220px]" role="menu">
        <div class="flex items-center gap-1 px-1.5 pb-1.5 mb-1 border-b border-black/[0.06] dark:border-white/10">
          <button type="button" class="efv-menu-step" :disabled="docStore.scale <= MIN_SCALE" :aria-label="$t('zoom-out')" @click="docStore.zoomOut()">−</button>
          <span class="flex-1 text-center text-[12.5px] tabular-nums">{{ zoomPercent }}</span>
          <button type="button" class="efv-menu-step" :disabled="docStore.scale >= MAX_SCALE" :aria-label="$t('zoom-in')" @click="docStore.zoomIn()">+</button>
        </div>
        <button type="button" class="efv-menu-item" role="menuitem" @click="docStore.fitWidth(); openMenu = null">
          {{ $t('zoom-fit-width') }}
          <svg v-if="docStore.fitToWidth" aria-hidden="true" class="ml-auto size-3.5" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        </button>
        <button type="button" class="efv-menu-item" role="menuitem" @click="docStore.setScale(1); openMenu = null">
          {{ $t('zoom-actual') }}<span class="efv-menu-kbd">⌘0</span>
        </button>
        <p class="px-3 pt-1.5 text-[11px] text-[#8e8e93]">{{ $t('zoom-pinch-hint') }}</p>
      </div>
    </div>

    <span class="hidden sm:block w-px h-5 mx-1" :class="divider" />

    <!-- Actions: each opens its card right here -->
    <div v-if="can.cite && inBar.cite" class="relative">
      <BarButton :label="$t('citation')" shortcut="C" :active="docStore.actionPopover === 'cite'" :show-label="false" @click="toggleAction('cite')">
        <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="currentColor"><path d="M8.2 5.6c.8.9 1.2 1.9 1.2 3.5 0 2.9-2 5.5-5 6.8l-.7-1.1c2.8-1.5 3.3-3.4 3.5-4.7-.4.2-1 .3-1.6.3a2.9 2.9 0 1 1 2.6-4.8zm8 0c.8.9 1.2 1.9 1.2 3.5 0 2.9-2 5.5-5 6.8l-.7-1.1c2.8-1.5 3.3-3.4 3.5-4.7-.4.2-1 .3-1.6.3a2.9 2.9 0 1 1 2.6-4.8z" /></svg>
      </BarButton>
      <ActionPopover v-if="docStore.actionPopover === 'cite'" :title="$t('citation')" shortcut="C" :width="420" @close="docStore.actionPopover = null">
        <CitePanel />
      </ActionPopover>
    </div>

    <div v-if="can.share && inBar.share" class="relative">
      <BarButton :label="$t('share')" shortcut="S" :active="docStore.actionPopover === 'share'" @click="toggleAction('share')">
        <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="none"><path d="M10 12.5V3m0 0L6.5 6.5M10 3l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /><path d="M6.5 9.5H5A1.5 1.5 0 0 0 3.5 11v4.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V11A1.5 1.5 0 0 0 15 9.5h-1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
      </BarButton>
      <ActionPopover v-if="docStore.actionPopover === 'share'" :title="$t('share')" shortcut="S" @close="docStore.actionPopover = null">
        <SharePanel />
      </ActionPopover>
    </div>

    <div v-if="can.print && inBar.print" class="relative">
      <BarButton :label="$t('print')" shortcut="P" :active="docStore.actionPopover === 'print'" @click="toggleAction('print')">
        <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="none"><path d="M5.5 7.5V3.5h9v4M5.5 14H4a1.5 1.5 0 0 1-1.5-1.5v-3.5A1.5 1.5 0 0 1 4 7.5h12a1.5 1.5 0 0 1 1.5 1.5v3.5A1.5 1.5 0 0 1 16 14h-1.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /><rect x="5.5" y="11.5" width="9" height="5" rx="0.8" stroke="currentColor" stroke-width="1.5" /></svg>
      </BarButton>
      <ActionPopover v-if="docStore.actionPopover === 'print'" :title="$t('print')" shortcut="P" :width="340" @close="docStore.actionPopover = null">
        <PrintPanel />
      </ActionPopover>
    </div>

    <BarButton v-if="can.download && inBar.download" :label="$t('download')" shortcut="D" @click="download">
      <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="none"><path d="M10 3v9.5m0 0L6.5 9M10 12.5L13.5 9M4 13.5v1.5A1.5 1.5 0 0 0 5.5 16.5h9A1.5 1.5 0 0 0 16 15v-1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </BarButton>

    <div v-if="inBar.info" class="relative">
      <BarButton :label="$t('info')" shortcut="I" :active="docStore.actionPopover === 'info'" @click="toggleAction('info')">
        <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.25" stroke="currentColor" stroke-width="1.5" /><path d="M10 9v4.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /><circle cx="10" cy="6.6" r="0.95" fill="currentColor" /></svg>
      </BarButton>
      <ActionPopover v-if="docStore.actionPopover === 'info'" :title="$t('info')" shortcut="I" :width="360" @close="docStore.actionPopover = null">
        <InfoPanel />
      </ActionPopover>
    </div>

    <span class="hidden sm:block w-px h-5 mx-1" :class="divider" />

    <div v-if="can.suggest" class="relative">
      <BarButton :label="$t('recommendations')" shortcut="R" :active="openMenu === 'suggestions'" @click="toggleMenu('suggestions')">
        <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 16a5 5 0 1 1 6 0a3.5 3.5 0 0 0 -1 3a2 2 0 0 1 -4 0a3.5 3.5 0 0 0 -1 -3" /><path d="M9.7 17l4.6 0" /></svg>
      </BarButton>
      <SuggestionsPopup v-if="openMenu === 'suggestions'" placement="below" />
    </div>

    <BarButton v-if="can.draw" :label="$t(docStore.drawMode ? 'edit-disable' : 'edit-enable')" shortcut="E" :active="docStore.drawMode" @click="docStore.setDrawMode(!docStore.drawMode)">
      <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="none"><path d="M13.5 3.5l3 3L7 16H4v-3l9.5-9.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" /></svg>
    </BarButton>

    <BarButton v-if="can.ask" :label="$t('ask')" shortcut="A" :active="assistantStore.isChatOpen" :show-label="width >= 768" @click="toggleChat">
      <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l1.9 5.1 5.1 1.9-5.1 1.9L10 15.5l-1.9-5.1L3 8.5l5.1-1.9L10 1.5z" /></svg>
    </BarButton>

    <!-- The rest, and whatever a narrow screen had no room for -->
    <div class="relative">
      <BarButton :label="$t('more')" :active="openMenu === 'more'" @click="toggleMenu('more')">
        <svg aria-hidden="true" class="size-[18px]" viewBox="0 0 20 20" fill="currentColor"><circle cx="4.5" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="15.5" cy="10" r="1.6" /></svg>
      </BarButton>
      <div v-if="openMenu === 'more'" class="efv-menu right-0 w-[240px]" role="menu">
        <button v-if="can.cite && !inBar.cite" type="button" class="efv-menu-item" role="menuitem" @click="toggleAction('cite')">{{ $t('citation') }}<span class="efv-menu-kbd">C</span></button>
        <button v-if="can.share && !inBar.share" type="button" class="efv-menu-item" role="menuitem" @click="toggleAction('share')">{{ $t('share') }}<span class="efv-menu-kbd">S</span></button>
        <button v-if="can.print && !inBar.print" type="button" class="efv-menu-item" role="menuitem" @click="toggleAction('print')">{{ $t('print') }}<span class="efv-menu-kbd">P</span></button>
        <button v-if="can.download && !inBar.download" type="button" class="efv-menu-item" role="menuitem" @click="download">{{ $t('download') }}<span class="efv-menu-kbd">D</span></button>
        <template v-if="!inBar.info">
          <button type="button" class="efv-menu-item" role="menuitem" @click="toggleAction('info')">{{ $t('info') }}<span class="efv-menu-kbd">I</span></button>
          <div class="my-1 border-t border-black/[0.06] dark:border-white/10" />
        </template>
        <button type="button" class="efv-menu-item" role="menuitem" @click="emit('toggleDark'); openMenu = null">
          {{ isDark ? $t('light-mode') : $t('dark-mode') }}
        </button>
        <button type="button" class="efv-menu-item" role="menuitem" @click="toggleFullScreen">
          {{ docStore.isFullscreenMode ? $t('fullscreen-disable') : $t('fullscreen-enable') }}
        </button>
        <div class="my-1 border-t border-black/[0.06] dark:border-white/10" />
        <p class="px-3.5 py-1 text-[11px] leading-relaxed text-[#8e8e93]">{{ $t('shortcuts-hint') }}</p>
        <template v-if="viewerStore.closeFunction">
          <div class="my-1 border-t border-black/[0.06] dark:border-white/10" />
          <button type="button" class="efv-menu-item" role="menuitem" @click="viewerStore.closeFunction?.()">{{ $t('close') }}</button>
        </template>
      </div>

      <!-- A folded action opens its card under "⋯" -->
      <ActionPopover v-if="docStore.actionPopover === 'cite' && anchoredAt('cite') === 'more'" :title="$t('citation')" shortcut="C" @close="docStore.actionPopover = null"><CitePanel /></ActionPopover>
      <ActionPopover v-if="docStore.actionPopover === 'share' && anchoredAt('share') === 'more'" :title="$t('share')" shortcut="S" @close="docStore.actionPopover = null"><SharePanel /></ActionPopover>
      <ActionPopover v-if="docStore.actionPopover === 'print' && anchoredAt('print') === 'more'" :title="$t('print')" shortcut="P" @close="docStore.actionPopover = null"><PrintPanel /></ActionPopover>
      <ActionPopover v-if="docStore.actionPopover === 'info' && anchoredAt('info') === 'more'" :title="$t('info')" shortcut="I" @close="docStore.actionPopover = null"><InfoPanel /></ActionPopover>
    </div>
  </header>
</template>

<style scoped>
.efv-menu {
  position: absolute;
  top: calc(100% + 6px);
  z-index: 40;
  padding: 6px 0;
  border-radius: 10px;
  background: #fff;
  color: #1d1d1f;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.05);
}
.dark .efv-menu {
  background: #2a2a2c;
  color: #f2f2f7;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.efv-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 14px;
  font-size: 13px;
  text-align: left;
}
.efv-menu-item:hover,
.efv-menu-item:focus-visible {
  background: #0077cc;
  color: #fff;
  outline: none;
}
.efv-menu-kbd {
  margin-left: auto;
  font-size: 11px;
  opacity: 0.6;
}
.efv-menu-step {
  width: 28px;
  height: 26px;
  border-radius: 7px;
  font-size: 16px;
  line-height: 1;
}
.efv-menu-step:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
}
.efv-menu-step:disabled {
  opacity: 0.3;
}
</style>
