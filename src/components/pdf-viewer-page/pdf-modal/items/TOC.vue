<script setup lang="ts">
import { MODAL_CONTENT } from '@/assets/utils/enums';
import type { ITOCItem } from '@/assets/utils/interfaces';
import { useDocumentStore } from '@/stores';

import { TOCItem } from '.';
import { onMounted } from 'vue';

const docStore = useDocumentStore();

const handleItemClick = (page: number) => {
  if (page === -1) return;
  docStore.setActivePage(page);
  docStore.setModalContent(MODAL_CONTENT.NULL);
};

const handleToggleExpand = (item: ITOCItem) => {
  item.isExpanded = !item.isExpanded;
};

onMounted(() => {
  console.log(docStore.toc);
});
</script>

<template>
  <div class="w-full overflow-auto">
    <TOCItem
      v-for="(item, i) in docStore.toc"
      :key="`${item.title}-${i}`"
      :item="item"
      @item-click="handleItemClick"
      @toggle-expand="handleToggleExpand"
    />
  </div>
</template>
