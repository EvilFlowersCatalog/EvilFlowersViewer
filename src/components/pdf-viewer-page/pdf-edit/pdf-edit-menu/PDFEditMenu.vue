<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { EDIT_TOOL } from '@/assets/utils/enums';
import { useDocumentStore } from '@/stores';
import { ToolOptions } from '.';
import { tools } from '@/assets/utils/constans';
import backSvg from '@/assets/icons/back.svg?raw';
import forwardSvg from '@/assets/icons/forward.svg?raw';

//Data
const docStore = useDocumentStore();

// Accessible names for each drawing tool.
const toolLabels: Record<EDIT_TOOL, string> = {
  [EDIT_TOOL.MOUSE]: 'tool-cursor',
  [EDIT_TOOL.ERASER]: 'tool-eraser',
  [EDIT_TOOL.PEN]: 'tool-pen',
  [EDIT_TOOL.HIGHLIGHTER]: 'tool-highlighter',
  [EDIT_TOOL.CIRCLE]: 'tool-circle',
  [EDIT_TOOL.RECT]: 'tool-rectangle',
  [EDIT_TOOL.LINE]: 'tool-line',
};
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
    class="fixed top-4 right-4 transition-opacity duration-200 z-20"
    :class="
      showEditBar
        ? 'opacity-1 pointer-events-auto'
        : 'opacity-0 pointer-events-none'
    "
  >
    <div
      @mouseover="handleHover(true)"
      @mouseleave="handleHover(false)"
      class="relative flex flex-row justify-center items-center bg-white dark:bg-[#1E1E1E] pl-2 pr-[13px] py-1 mx-auto rounded-[5px] gap-[5px] shadow-[0px_4px_6px_0px_rgba(0,0,0,0.1)]"
      role="toolbar"
      :aria-label="$t('edit-enable')"
    >
      <!-- Undo / redo — plain actions, never shown as "selected" -->
      <button
        type="button"
        :disabled="!docStore.canUndo"
        class="size-5 flex items-center justify-center rounded-[4px] p-1 hover:bg-secondary/40 disabled:opacity-30 disabled:pointer-events-none"
        :aria-label="$t('undo')"
        @click="docStore.undo"
      >
        <span aria-hidden="true" class="icon-dark dark:!text-white" v-html="backSvg" />
      </button>
      <button
        type="button"
        :disabled="!docStore.canRedo"
        class="size-5 flex items-center justify-center rounded-[4px] p-1 hover:bg-secondary/40 disabled:opacity-30 disabled:pointer-events-none"
        :aria-label="$t('redo')"
        @click="docStore.redo"
      >
        <span aria-hidden="true" class="icon-dark dark:!text-white" v-html="forwardSvg" />
      </button>

      <!-- Tools options -->
      <ToolOptions
        v-if="![EDIT_TOOL.MOUSE, EDIT_TOOL.ERASER].includes(docStore.editTool)"
      />

      <!-- Button -->
      <button
        v-for="item of tools"
        :key="item.tool"
        class="size-5 flex items-center justify-center rounded-[4px] p-1"
        :class="
          item.tool === docStore.editTool
            ? 'bg-primary/40 border border-primary [&_svg_*]:fill-primary/80 [&_svg_*]:stroke-primary'
            : 'hover:bg-secondary/40'
        "
        :aria-label="$t(toolLabels[item.tool])"
        :aria-pressed="item.tool === docStore.editTool"
        @click="docStore.editTool = item.tool"
      >
        <!-- Icon -->
        <component :is="item.icon" aria-hidden="true" class="icon-dark dark:!text-white" />
      </button>
    </div>
  </div>
</template>
