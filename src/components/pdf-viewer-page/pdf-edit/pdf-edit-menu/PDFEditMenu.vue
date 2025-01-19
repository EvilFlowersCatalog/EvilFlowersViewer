<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { EDIT_TOOL } from '@/assets/utils/enums';
import { useDocumentStore } from '@/stores';
import { ToolOptions } from '.';
import { tools } from '@/assets/utils/constans';

//Data
const docStore = useDocumentStore();
const showEditBar = ref<boolean>(false);
const isHovering = ref<boolean>(false);
let mouseMoveTimeout: ReturnType<typeof setTimeout> | null = null;

// Handle when we hover over our edit menu
const handleHover = (hover: boolean) => {
  isHovering.value = hover;
};

// Function to handle mouse movement
const handleMouseMove = () => {
  showEditBar.value = true;

  // Clear the previous timeout if there's any
  if (mouseMoveTimeout) {
    clearTimeout(mouseMoveTimeout);
  }

  // Set a timeout to hide if it's not hovering
  mouseMoveTimeout = setTimeout(() => {
    // Do not hide when we're hovering over our menu
    if (!isHovering.value) showEditBar.value = false;
  }, 1000);
};

// Mount the mousemove event listener when the component is mounted
onMounted(() => {
  window.addEventListener('mousemove', handleMouseMove);
});

// Clean up the event listener when the component is destroyed
onBeforeUnmount(() => {
  if (mouseMoveTimeout) {
    clearTimeout(mouseMoveTimeout);
  }
  window.removeEventListener('mousemove', handleMouseMove);
});
</script>

<template>
  <!-- Edit menu -->
  <div
    class="fixed top-2 right-4 transition-opacity duration-200 z-20"
    :class="
      showEditBar
        ? 'opacity-1 pointer-events-auto'
        : 'opacity-0 pointer-events-none'
    "
  >
    <div
      @mouseover="handleHover(true)"
      @mouseleave="handleHover(false)"
      class="relative flex flex-col justify-center items-center bg-primary p-1 mx-auto rounded-md gap-3"
    >
      <!-- Tools options -->
      <ToolOptions
        v-if="![EDIT_TOOL.MOUSE, EDIT_TOOL.ERASER].includes(docStore.editTool)"
      />

      <!-- Button -->
      <button
        v-for="item of tools"
        :key="item.tool"
        class="p-1 rounded-md"
        :class="
          item.tool === docStore.editTool
            ? 'bg-secondary'
            : 'hover:bg-secondary/40'
        "
        @click="docStore.setEditTool(item.tool)"
      >
        <!-- Icon -->
        <component :is="item.icon" class="icon" />
      </button>
    </div>
  </div>
</template>
