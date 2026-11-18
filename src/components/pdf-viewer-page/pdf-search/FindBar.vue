<script setup lang="ts">
// Compact find pill over the page while results exist and the search panel is
// closed: step through hits (‹ ›, Enter, F3), reopen the list, or clear.
import { computed, inject, ref, type Ref } from 'vue';
import { useDocumentStore, useSearchStore } from '@/stores';
import { SIDEBAR_STATE } from '@/assets/utils/enums';
import { useEscapeLayer } from '../../pdf-aids/useEscapeLayer';

const docStore = useDocumentStore();
const search = useSearchStore();
const isDark = inject<Ref<boolean>>('isDark', ref(false));

const visible = computed(
  () =>
    docStore.sidebarState !== SIDEBAR_STATE.SEARCH &&
    (search.hits.length > 0 || search.status === 'searching')
);

const label = computed(() =>
  search.source === 'host' ? search.hostLabel ?? '' : search.query
);

const openList = () => (docStore.sidebarState = SIDEBAR_STATE.SEARCH);

useEscapeLayer(
  () => visible.value,
  () => search.clear()
);
</script>

<template>
  <div
    v-if="visible"
    data-efv-float
    class="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-0.5 h-9 pl-3 pr-1 rounded-full shadow-[0_6px_20px_rgba(0,0,0,0.18)] text-[12px] max-w-[calc(100%-24px)]"
    :class="isDark ? 'bg-[#232323] text-white/90 ring-1 ring-white/10' : 'bg-white text-[#222] ring-1 ring-black/5'"
    role="search"
    :aria-label="$t('search')"
  >
    <svg aria-hidden="true" class="size-3.5 shrink-0 opacity-60" viewBox="0 0 20 20" fill="none">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.8" />
      <path d="M13 13l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
    </svg>
    <button
      type="button"
      class="ml-1.5 max-w-[180px] truncate font-medium hover:underline"
      :title="$t('search-open-list')"
      @click="openList"
    >
      {{ label }}
    </button>
    <span class="mx-2 tabular-nums opacity-70 whitespace-nowrap" aria-live="polite">
      <template v-if="search.status === 'searching' && search.source === 'text'">…</template>
      <template v-else>{{ search.active !== null ? search.active + 1 : '–' }} / {{ search.hits.length }}</template>
    </span>
    <button
      type="button"
      class="size-7 flex items-center justify-center rounded-full hover:bg-[#0077cc]/10 disabled:opacity-30"
      :disabled="!search.hits.length"
      :aria-label="$t('previous-result')"
      :title="`${$t('previous-result')} (Shift+F3)`"
      @click="search.step(-1)"
    >
      <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none"><path d="M5 12l5-5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <button
      type="button"
      class="size-7 flex items-center justify-center rounded-full hover:bg-[#0077cc]/10 disabled:opacity-30"
      :disabled="!search.hits.length"
      :aria-label="$t('next-result')"
      :title="`${$t('next-result')} (F3)`"
      @click="search.step(1)"
    >
      <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
    </button>
    <button
      type="button"
      class="size-7 flex items-center justify-center rounded-full hover:bg-[#0077cc]/10"
      :aria-label="$t('search-open-list')"
      :title="$t('search-open-list')"
      @click="openList"
    >
      <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none"><path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
    </button>
    <button
      type="button"
      class="size-7 flex items-center justify-center rounded-full hover:bg-[#0077cc]/10"
      :aria-label="$t('search-clear')"
      :title="`${$t('search-clear')} (Esc)`"
      @click="search.clear()"
    >
      <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
    </button>
  </div>
</template>
