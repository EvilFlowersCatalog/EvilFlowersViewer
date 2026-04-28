<script setup lang="ts">
import { MODAL_CONTENT, SIDEBAR_STATE } from '@/assets/utils/enums';
import type { ITOCItem } from '@/assets/utils/interfaces';
import { useDocumentStore } from '@/stores';
import { TOCItem } from '.';

const docStore = useDocumentStore();

const handleItemClick = (page: number) => {
  if (page === -1) return;
  docStore.setActivePage(page);
  docStore.setModalContent(MODAL_CONTENT.NULL);
  docStore.setSidebarState(SIDEBAR_STATE.NULL);
};

const handleToggleExpand = (item: ITOCItem) => {
  item.isExpanded = !item.isExpanded;
};
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
