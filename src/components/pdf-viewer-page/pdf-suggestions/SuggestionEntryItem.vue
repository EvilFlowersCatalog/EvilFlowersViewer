<script setup lang="ts">
// Style-cloned from elvira-portal/src/components/items/entry/display/EntryItem.tsx.
// Behavior goes through the openEntryDetailFunction/bookmarkToggleFunction host hooks.
import { ref } from 'vue';
import { useViewerStore } from '@/stores';
import type { ISuggestedEntry } from '@/assets/utils/interfaces';

const props = withDefaults(
  defineProps<{ entry: ISuggestedEntry; variant?: 'card' | 'row' }>(),
  { variant: 'card' }
);

const viewerStore = useViewerStore();
const currentEntry = ref<ISuggestedEntry>({ ...props.entry });
const isOnShelf = ref(currentEntry.value.shelf_record_id != null);
const toggling = ref(false);

const openDetail = () => viewerStore.openEntryDetailFunction?.(currentEntry.value);

const toggleBookmark = async () => {
  if (!viewerStore.bookmarkToggleFunction || toggling.value) return;
  const previous = isOnShelf.value;
  isOnShelf.value = !previous;
  toggling.value = true;
  try {
    const result = await viewerStore.bookmarkToggleFunction(currentEntry.value);
    isOnShelf.value = result.isOnShelf;
    currentEntry.value = {
      ...currentEntry.value,
      shelf_record_id: result.shelfRecordId ?? null,
    };
  } catch {
    isOnShelf.value = previous;
  } finally {
    toggling.value = false;
  }
};

const authorLine = (entry: ISuggestedEntry) =>
  entry.authors.length > 0 ? `${entry.authors[0].name} ${entry.authors[0].surname}` : '';
</script>

<template>
  <!-- Card variant: 2-up grid, screenshot 5 -->
  <div
    v-if="variant === 'card'"
    class="group rounded-[8px] relative w-full bg-white dark:bg-[#2a2a2a] shadow-[0px_2px_6px_0px_rgba(0,0,0,0.12)] hover:shadow-[0px_4px_12px_rgba(0,0,0,0.2)] transition-shadow duration-300 flex flex-col gap-[6px] pb-[8px] overflow-hidden"
  >
    <div class="h-[90px] relative shrink-0 w-full overflow-hidden rounded-t-[8px] bg-[#e5e5e5]">
      <button
        type="button"
        class="w-full h-full cursor-pointer"
        :aria-label="entry.title"
        @click="openDetail"
      >
        <img class="w-full h-full object-cover" :src="entry.thumbnail" :alt="entry.title" loading="lazy" />
      </button>
      <button
        type="button"
        :disabled="!viewerStore.bookmarkToggleFunction"
        :aria-pressed="isOnShelf"
        :aria-label="$t(isOnShelf ? 'remove-from-shelf' : 'add-to-shelf')"
        class="absolute top-[5px] right-[4px] w-6 h-5 rounded-[6px] flex items-center justify-center drop-shadow-[0px_2px_4px_rgba(0,0,0,0.15)] disabled:opacity-0"
        :class="isOnShelf ? 'bg-[#e0edff]' : 'bg-white'"
        @click="toggleBookmark"
      >
        <svg width="10" height="13" viewBox="0 0 14 18" fill="none" aria-hidden="true">
          <path
            :stroke="isOnShelf ? '#0077cc' : '#333333'"
            :fill="isOnShelf ? '#0077cc' : 'none'"
            d="M12.8333 16.5L6.99999 12.3333L1.16666 16.5V3.16667C1.16666 2.72464 1.34225 2.30072 1.65481 1.98816C1.96737 1.67559 2.3913 1.5 2.83332 1.5H11.1667C11.6087 1.5 12.0326 1.67559 12.3452 1.98816C12.6577 2.30072 12.8333 2.72464 12.8333 3.16667V16.5Z"
            stroke-width="1.25"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
    </div>
    <div class="flex flex-col gap-[2px] px-[7px] min-w-0">
      <h4
        class="cursor-pointer font-semibold text-[11px] leading-[13px] text-[#222] dark:text-white line-clamp-2 hover:underline"
        @click="openDetail"
      >
        {{ entry.title }}
      </h4>
      <p v-if="authorLine(entry)" class="font-light text-[9px] text-[#666] dark:text-gray-300 truncate">
        {{ authorLine(entry) }}
      </p>
    </div>
  </div>

  <!-- Row variant: compact list, screenshot 2 -->
  <button
    v-else
    type="button"
    class="group flex items-center gap-[10px] w-full text-left px-[4px] py-[4px] rounded-[6px] hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors"
    @click="openDetail"
  >
    <div class="relative shrink-0 w-[34px] h-[46px] rounded-[4px] overflow-hidden bg-[#e5e5e5]">
      <img class="w-full h-full object-cover" :src="entry.thumbnail" :alt="entry.title" loading="lazy" />
    </div>
    <div class="flex-1 min-w-0 flex flex-col gap-[1px]">
      <span class="font-medium text-[11px] leading-[14px] text-[#222] dark:text-white line-clamp-2 group-hover:underline">
        {{ entry.title }}
      </span>
      <span v-if="authorLine(entry)" class="font-light text-[9px] text-[#777] dark:text-gray-400 truncate">
        {{ authorLine(entry) }}
      </span>
    </div>
    <span
      role="button"
      tabindex="0"
      :aria-pressed="isOnShelf"
      :aria-label="$t(isOnShelf ? 'remove-from-shelf' : 'add-to-shelf')"
      class="shrink-0 size-6 flex items-center justify-center rounded-[5px]"
      :class="viewerStore.bookmarkToggleFunction ? 'hover:bg-black/5 dark:hover:bg-white/10' : 'opacity-0 pointer-events-none'"
      @click.stop="toggleBookmark"
      @keydown.enter.stop="toggleBookmark"
    >
      <svg width="10" height="13" viewBox="0 0 14 18" fill="none" aria-hidden="true">
        <path
          :stroke="isOnShelf ? '#0077cc' : '#999'"
          :fill="isOnShelf ? '#0077cc' : 'none'"
          d="M12.8333 16.5L6.99999 12.3333L1.16666 16.5V3.16667C1.16666 2.72464 1.34225 2.30072 1.65481 1.98816C1.96737 1.67559 2.3913 1.5 2.83332 1.5H11.1667C11.6087 1.5 12.0326 1.67559 12.3452 1.98816C12.6577 2.30072 12.8333 2.72464 12.8333 3.16667V16.5Z"
          stroke-width="1.25"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </button>
</template>
