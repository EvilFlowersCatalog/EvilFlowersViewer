<script setup lang="ts">
// Notes: what the reader (and the assistant) marked in this book. Bookmarked
// pages first, then the highlights list when the host keeps highlights.
import { computed } from 'vue';
import { useDocumentStore, useViewerStore } from '@/stores';
import { BookmarkIcon } from '@/components/pdf-aids';
import { AgentHighlights } from '../pdf-menu/pdf-menu-sidebar/items';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();

const bookmarks = computed(() => [...docStore.bookmarks.keys()].sort((a, b) => a - b));
const hasHighlights = computed(
  () => !!(viewerStore.agentAnnotationPackage || viewerStore.readerHighlightPackage)
);
</script>

<template>
  <div class="flex flex-col gap-3 px-3 py-3">
    <section>
      <h3 class="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6e6e73] dark:text-gray-400">
        {{ $t('bookmarks') }}
      </h3>
      <p v-if="!bookmarks.length" class="px-1 text-[12.5px] leading-relaxed text-[#8e8e93]">
        {{ $t('bookmarks-empty') }}
      </p>
      <button
        v-for="page in bookmarks"
        :key="page"
        type="button"
        class="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[8px] text-left text-[13px] transition-colors"
        :class="
          docStore.activePage === page
            ? 'bg-[#0077cc]/12 text-[#1d1d1f] dark:text-white'
            : 'text-[#3a3a3c] dark:text-gray-200 hover:bg-black/[0.04] dark:hover:bg-white/5'
        "
        @click="docStore.goTo(page, 'outline')"
      >
        <BookmarkIcon class="text-[#0077cc] shrink-0" :filled="true" :width="10" :height="14" />
        <span class="flex-1">{{ $t('page') }} {{ docStore.pageLabel(page) ?? page }}</span>
      </button>
    </section>

    <section v-if="hasHighlights">
      <h3 class="px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6e6e73] dark:text-gray-400">
        {{ $t('highlights') }}
      </h3>
      <AgentHighlights />
    </section>
  </div>
</template>
