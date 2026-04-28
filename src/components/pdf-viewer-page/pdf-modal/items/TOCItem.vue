<script lang="ts" setup>
import type { ITOCItem } from '@/assets/utils/interfaces';

const { item } = defineProps<{ item: ITOCItem }>();

const emit = defineEmits<{
  (event: 'item-click', page: number): void;
  (event: 'toggle-expand', item: ITOCItem): void;
}>();

const handleItemClick = (page: number) => emit('item-click', page);
const handleToggleExpand = () => emit('toggle-expand', item);
</script>

<template>
  <div
    class="flex w-full items-baseline gap-2 mb-2"
    :style="{ paddingLeft: `${item.level * 12}px` }"
  >
    <!-- Title -->
    <button
      @click="handleItemClick(item.pageNumber)"
      class="text-sm text-left text-gray-800 dark:text-gray-200 hover:text-secondary dark:hover:text-secondary transition-colors shrink-0 max-w-[70%] truncate"
      :class="item.level === 0 ? 'font-semibold' : 'font-normal text-gray-600 dark:text-gray-400'"
    >
      {{ item.title }}
    </button>

    <!-- Dotted line -->
    <span class="border-b border-dashed border-gray-300 dark:border-gray-600 flex-1 mb-0.5"></span>

    <!-- Page number -->
    <button
      v-if="item.pageNumber !== -1"
      @click="handleItemClick(item.pageNumber)"
      class="text-xs text-gray-500 dark:text-gray-400 hover:text-secondary transition-colors shrink-0 font-medium"
    >
      {{ item.pageNumber }}
    </button>

    <!-- Expand toggle -->
    <button
      v-if="item.children.length > 0"
      @click="handleToggleExpand"
      class="text-gray-400 dark:text-gray-500 hover:text-secondary dark:hover:text-secondary transition-colors shrink-0"
    >
      <svg class="size-3.5" viewBox="0 0 12 12" fill="none">
        <path
          :d="item.isExpanded ? 'M2 8L6 4L10 8' : 'M2 4L6 8L10 4'"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </div>

  <!-- Children -->
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
