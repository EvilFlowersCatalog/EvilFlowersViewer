<script setup lang="ts">
// Drawing tools as a vertical rail docked to the right of the page area. It
// takes its own column (the page narrows), so it never covers the page, the
// chat or any popup. Size and colour live in a popover behind the swatch.
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { EDIT_TOOL } from '@/assets/utils/enums';
import { useDocumentStore } from '@/stores';
import { ToolOptions } from '.';
import { tools } from '@/assets/utils/constans';
import backSvg from '@/assets/icons/back.svg?raw';
import forwardSvg from '@/assets/icons/forward.svg?raw';

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

// Size and colour only matter for tools that draw.
const hasOptions = computed(() => ![EDIT_TOOL.MOUSE, EDIT_TOOL.ERASER].includes(docStore.editTool));
const optionsOpen = ref(false);
const optionsRef = ref<HTMLDivElement | null>(null);

watch(hasOptions, (has) => {
  if (!has) optionsOpen.value = false;
});

// Close the popover on any press outside it.
const onPointerDown = (event: PointerEvent) => {
  if (optionsRef.value && !optionsRef.value.contains(event.target as Node)) optionsOpen.value = false;
};
watch(optionsOpen, (open) => {
  if (open) document.addEventListener('pointerdown', onPointerDown, true);
  else document.removeEventListener('pointerdown', onPointerDown, true);
});
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown, true));

const btn = 'size-7 flex items-center justify-center rounded-[5px] p-1 transition-colors';
</script>

<template>
  <div
    class="relative flex flex-col items-center w-10 shrink-0 py-2 gap-1 bg-topbar-bg border-l border-efv-border z-20"
    role="toolbar"
    aria-orientation="vertical"
    :aria-label="$t('edit-enable')"
  >
    <!-- Tools -->
    <button
      v-for="item of tools"
      :key="item.tool"
      type="button"
      :class="[
        btn,
        item.tool === docStore.editTool
          ? 'bg-primary/40 border border-primary [&_svg_*]:fill-primary/80 [&_svg_*]:stroke-primary'
          : 'hover:bg-secondary/40',
      ]"
      :title="$t(toolLabels[item.tool])"
      :aria-label="$t(toolLabels[item.tool])"
      :aria-pressed="item.tool === docStore.editTool"
      @click="docStore.editTool = item.tool"
    >
      <component :is="item.icon" aria-hidden="true" class="icon-dark dark:!text-white" />
    </button>

    <!-- Current colour + size; opens the options to the left of the rail -->
    <div v-if="hasOptions" ref="optionsRef" class="relative mt-1">
      <button
        type="button"
        :class="[btn, optionsOpen ? 'bg-secondary/20' : 'hover:bg-secondary/20']"
        :title="$t('colors')"
        :aria-label="$t('colors')"
        :aria-expanded="optionsOpen"
        @click="optionsOpen = !optionsOpen"
      >
        <span
          class="rounded-full ring-1 ring-black/10 dark:ring-white/20"
          :style="{
            backgroundColor: docStore.toolColor,
            width: `${Math.min(18, 6 + docStore.toolSize)}px`,
            height: `${Math.min(18, 6 + docStore.toolSize)}px`,
          }"
        />
      </button>
      <ToolOptions v-if="optionsOpen" class="absolute right-full top-0 mr-2" />
    </div>

    <div class="w-5 h-px bg-efv-border my-1" aria-hidden="true" />

    <!-- Undo / redo — plain actions, never shown as "selected" -->
    <button
      type="button"
      :disabled="!docStore.canUndo"
      :class="[btn, 'hover:bg-secondary/40 disabled:opacity-30 disabled:pointer-events-none']"
      :title="$t('undo')"
      :aria-label="$t('undo')"
      @click="docStore.undo"
    >
      <span aria-hidden="true" class="icon-dark dark:!text-white" v-html="backSvg" />
    </button>
    <button
      type="button"
      :disabled="!docStore.canRedo"
      :class="[btn, 'hover:bg-secondary/40 disabled:opacity-30 disabled:pointer-events-none']"
      :title="$t('redo')"
      :aria-label="$t('redo')"
      @click="docStore.redo"
    >
      <span aria-hidden="true" class="icon-dark dark:!text-white" v-html="forwardSvg" />
    </button>
  </div>
</template>
