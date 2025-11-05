<script lang="ts" setup>
import type { ITOCItem } from '@/assets/utils/interfaces';
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from '@kalimahapps/vue-icons';

// Props
const { item } = defineProps<{
  item: ITOCItem;
}>();

// Define emits
const emit = defineEmits<{
  (event: 'item-click', page: number): void;
  (event: 'toggle-expand', item: ITOCItem): void;
}>();

// Event handlers
const handleItemClick = (page: number) => emit('item-click', page);
const handleToggleExpand = () => emit('toggle-expand', item);
</script>

<template>
  <div class="flex w-full items-end gap-2 border-transparent mb-2">
    <!-- Title -->
    <button
      @click="handleItemClick(item.pageNumber)"
      class="text-white hover:text-secondary"
    >
      {{ item.title }}
    </button>

    <span class="border border-dashed h-full flex flex-1 mb-1.5"></span>

    <template v-if="item.children.length > 0">
      <!-- Expand button -->
      <MdKeyboardArrowDown
        v-if="!item.isExpanded"
        @click="handleToggleExpand"
        class="icon hover:text-secondary"
      />
      <MdKeyboardArrowUp
        v-else
        @click="handleToggleExpand"
        class="icon hover:text-secondary"
      />
    </template>
  </div>

  <!-- Nested items -->
  <div v-if="item.isExpanded && item.children.length > 0" class="pl-5">
    <TOCItem
      v-for="(child, j) in item.children"
      :key="`${child.title}-${j}`"
      :item="child"
      @item-click="$emit('item-click', $event)"
      @toggle-expand="$emit('toggle-expand', $event)"
    />
  </div>
</template>
