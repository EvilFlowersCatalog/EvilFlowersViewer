<script lang="ts" setup>
// One row of the contents: disclosure, title, page. The section the reader
// is in is marked, so the contents double as a "you are here".
import { computed, inject, type ComputedRef } from 'vue';
import type { ITOCItem } from '@/assets/utils/interfaces';
import { useDocumentStore } from '@/stores';

const { item } = defineProps<{ item: ITOCItem }>();

const emit = defineEmits<{
  (event: 'item-click', page: number): void;
  (event: 'toggle-expand', item: ITOCItem): void;
}>();

const docStore = useDocumentStore();
const current = inject<ComputedRef<ITOCItem | null>>('tocCurrent', computed(() => null));
const isCurrent = computed(() => current.value === item);
</script>

<template>
  <div
    class="group flex w-full items-center rounded-[7px] transition-colors"
    :class="isCurrent ? 'bg-[#0077cc]/10' : 'hover:bg-black/[0.04] dark:hover:bg-white/5'"
    :style="{ paddingLeft: `${item.level * 14}px` }"
  >
    <button
      v-if="item.children.length > 0"
      type="button"
      class="size-6 shrink-0 inline-flex items-center justify-center text-[#8e8e93] hover:text-[#1d1d1f] dark:hover:text-white"
      :aria-expanded="item.isExpanded"
      :aria-label="item.title"
      @click="emit('toggle-expand', item)"
    >
      <svg class="size-3 transition-transform" :class="item.isExpanded ? 'rotate-90' : ''" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M4.5 2.5L8 6l-3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>
    <span v-else class="w-6 shrink-0" />

    <button
      type="button"
      class="flex-1 min-w-0 flex items-baseline gap-3 py-[5px] pr-2 text-left"
      :disabled="item.pageNumber === -1"
      @click="emit('item-click', item.pageNumber)"
    >
      <span
        class="flex-1 min-w-0 text-[13px] leading-[1.35]"
        :class="[
          item.level === 0 ? 'font-medium text-[#1d1d1f] dark:text-white' : 'text-[#3a3a3c] dark:text-gray-300',
          isCurrent ? '!text-[#0077cc]' : '',
        ]"
      >
        {{ item.title }}
      </span>
      <span v-if="item.pageNumber !== -1" class="shrink-0 text-[12px] tabular-nums text-[#8e8e93]">
        {{ docStore.pageLabel(item.pageNumber) ?? item.pageNumber }}
      </span>
    </button>
  </div>

  <div v-if="item.isExpanded && item.children.length > 0">
    <TOCItem
      v-for="(child, j) in item.children"
      :key="`${child.title}-${j}`"
      :item="child"
      @item-click="$emit('item-click', $event)"
      @toggle-expand="$emit('toggle-expand', $event)"
    />
  </div>
</template>
