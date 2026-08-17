<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useDocumentStore, useViewerStore } from '@/stores';
import { SUGGESTION_KIND } from '@/assets/utils/enums';
import type { ISuggestedEntry } from '@/assets/utils/interfaces';
import { Loader } from '@/components/pdf-aids';
import SuggestionEntryItem from './SuggestionEntryItem.vue';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();

const tabs = [
  { kind: SUGGESTION_KIND.SIMILAR, label: 'similar' },
  { kind: SUGGESTION_KIND.PREREQUISITE, label: 'prerequisites' },
  { kind: SUGGESTION_KIND.ADVANCED, label: 'advanced' },
];
const activeTab = ref<SUGGESTION_KIND>(SUGGESTION_KIND.SIMILAR);
const loading = ref(false);
const cache = new Map<SUGGESTION_KIND, ISuggestedEntry[]>();
const entries = ref<ISuggestedEntry[]>([]);

const load = async (kind: SUGGESTION_KIND) => {
  const cached = cache.get(kind);
  if (cached) {
    entries.value = cached;
    return;
  }
  if (!viewerStore.suggestionsFunction) return;

  loading.value = true;
  try {
    const result = await viewerStore.suggestionsFunction(kind, {
      page: docStore.activePage,
    });
    cache.set(kind, result);
    entries.value = result;
  } catch {
    entries.value = [];
  } finally {
    loading.value = false;
  }
};

watch(activeTab, (kind) => load(kind));
onMounted(() => load(activeTab.value));
</script>

<template>
  <div
    class="absolute bottom-full right-[10px] mb-[8px] w-[280px] max-h-[360px] flex flex-col bg-white dark:bg-[#1e1e1e] rounded-[8px] shadow-[0px_6px_18px_rgba(0,0,0,0.2)] overflow-hidden z-20"
    role="dialog"
    :aria-label="$t('recommendations')"
  >
    <!-- Tabs -->
    <div class="flex items-center border-b border-gray-200 dark:border-white/10 shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.kind"
        type="button"
        class="flex-1 px-2 py-[7px] text-[10px] font-medium tracking-[0.1px] transition-colors truncate"
        :class="
          activeTab === tab.kind
            ? 'text-accent-ink border-b-2 border-accent-ink'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
        "
        :aria-pressed="activeTab === tab.kind"
        @click="activeTab = tab.kind"
      >
        {{ $t(tab.label) }}
      </button>
      <button
        type="button"
        class="shrink-0 p-[6px] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        :aria-label="$t('close')"
        @click="docStore.isSuggestionsPopupOpen = false"
      >
        <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-auto p-[10px]">
      <div v-if="loading" class="flex justify-center py-6">
        <Loader :size="24" color="#0077cc" :label="$t('recommendations')" />
      </div>
      <div v-else-if="entries.length === 0" class="flex justify-center py-6">
        <span class="text-[10px] text-[#b1b1b1]">{{ $t('no-suggestions') }}</span>
      </div>
      <div v-else class="grid grid-cols-2 gap-[8px]">
        <SuggestionEntryItem
          v-for="entry in entries"
          :key="entry.id"
          :entry="entry"
          variant="card"
        />
      </div>
    </div>
  </div>
</template>
