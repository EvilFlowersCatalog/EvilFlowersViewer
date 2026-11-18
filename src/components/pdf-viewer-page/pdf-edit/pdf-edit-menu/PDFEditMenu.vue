<script setup lang="ts">
// Drawing tools as a vertical rail docked to the right of the page area. It
// takes its own column (the page narrows), so it never covers the page, the
// chat or any popup. Colour, width and shape live in a popover behind the
// swatch; tapping the tool in hand opens it too.
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { EDIT_TOOL } from '@/assets/utils/enums';
import { useDocumentStore, useInkStore } from '@/stores';
import { ToolOptions } from '.';
import { RAIL_TOOLS, TOOL_ICONS, toolIcon } from './tools';
import backSvg from '@/assets/icons/back.svg?raw';
import forwardSvg from '@/assets/icons/forward.svg?raw';

const docStore = useDocumentStore();
const inkStore = useInkStore();

const hasOptions = computed(() => !!inkStore.currentStyle);
const optionsOpen = ref(false);
const optionsRef = ref<HTMLDivElement | null>(null);

watch(hasOptions, (has) => {
  if (!has) optionsOpen.value = false;
});

const pick = (tool: EDIT_TOOL) => {
  // The tool already in hand: show its options.
  if (docStore.editTool === tool && hasOptions.value) optionsOpen.value = !optionsOpen.value;
  else {
    docStore.editTool = tool;
    optionsOpen.value = false;
  }
};

// Close the popover on any press outside it.
const onPointerDown = (event: PointerEvent) => {
  const target = event.target as Node;
  if (optionsRef.value && !optionsRef.value.contains(target) && !(target as Element).closest?.('[data-rail-tool]'))
    optionsOpen.value = false;
};
watch(optionsOpen, (open) => {
  if (open) document.addEventListener('pointerdown', onPointerDown, true);
  else document.removeEventListener('pointerdown', onPointerDown, true);
});
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown, true));

const btn = 'size-8 flex items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary';
const hover = 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200';
const selected = 'bg-accent-soft text-accent-ink ring-1 ring-inset ring-accent-ink';
</script>

<template>
  <div
    class="relative flex flex-col items-center w-11 shrink-0 py-2 gap-1 bg-topbar-bg border-l border-efv-border z-20"
    role="toolbar"
    aria-orientation="vertical"
    :aria-label="$t('edit-enable')"
  >
    <!-- Tools -->
    <button
      v-for="item of RAIL_TOOLS"
      :key="item.tool"
      type="button"
      data-rail-tool
      :class="[btn, item.tool === docStore.editTool ? selected : hover]"
      :title="`${$t(item.label)} (${item.key})`"
      :aria-label="$t(item.label)"
      :aria-pressed="item.tool === docStore.editTool"
      :aria-keyshortcuts="item.key"
      @click="pick(item.tool)"
    >
      <span aria-hidden="true" class="inline-flex" v-html="toolIcon(item.tool, inkStore.shapeKind)" />
    </button>

    <!-- Current colour + width; opens the options to the left of the rail -->
    <div v-if="hasOptions && inkStore.currentStyle" ref="optionsRef" class="relative mt-1">
      <button
        type="button"
        :class="[btn, optionsOpen ? 'bg-accent-soft' : hover]"
        :title="$t('colors')"
        :aria-label="$t('colors')"
        :aria-expanded="optionsOpen"
        @click="optionsOpen = !optionsOpen"
      >
        <span
          class="rounded-full ring-1 ring-black/10 dark:ring-white/20"
          :style="{
            backgroundColor: inkStore.currentStyle.color,
            width: `${Math.min(20, 8 + inkStore.currentStyle.width)}px`,
            height: `${Math.min(20, 8 + inkStore.currentStyle.width)}px`,
          }"
        />
      </button>
      <ToolOptions v-if="optionsOpen" class="absolute right-full top-0 mr-2" />
    </div>

    <div class="w-5 h-px bg-efv-border my-1" aria-hidden="true" />

    <!-- Fingers: shown once a pen was used, so the reader can let fingers draw again -->
    <button
      v-if="inkStore.penSeen"
      type="button"
      :class="[btn, inkStore.fingerDraws ? selected : hover]"
      :title="$t(inkStore.fingerDraws ? 'ink-finger-draws' : 'ink-finger-scrolls')"
      :aria-label="$t('ink-finger-draws')"
      :aria-pressed="inkStore.fingerDraws"
      @click="inkStore.fingerDraws = !inkStore.fingerDraws"
    >
      <span aria-hidden="true" class="inline-flex" v-html="TOOL_ICONS.hand" />
    </button>

    <!-- Undo / redo: plain actions, never shown as "selected" -->
    <button
      type="button"
      :disabled="!inkStore.canUndo"
      :class="[btn, hover, 'disabled:opacity-30 disabled:pointer-events-none']"
      :title="`${$t('undo')} (⌘Z)`"
      :aria-label="$t('undo')"
      @click="inkStore.undo()"
    >
      <span aria-hidden="true" class="icon-dark dark:!text-white" v-html="backSvg" />
    </button>
    <button
      type="button"
      :disabled="!inkStore.canRedo"
      :class="[btn, hover, 'disabled:opacity-30 disabled:pointer-events-none']"
      :title="`${$t('redo')} (⇧⌘Z)`"
      :aria-label="$t('redo')"
      @click="inkStore.redo()"
    >
      <span aria-hidden="true" class="icon-dark dark:!text-white" v-html="forwardSvg" />
    </button>

    <!-- Autosave, quietly: a dot while changes wait or save, a check once
         saved; it only asks for attention when a save failed. -->
    <div class="mt-auto pt-2 flex items-center justify-center size-8">
      <button
        v-if="inkStore.saveState === 'error'"
        type="button"
        :class="[btn, 'text-[#ff3b30] hover:bg-black/5 dark:hover:bg-white/10']"
        :title="$t('ink-save-failed')"
        :aria-label="$t('ink-save-failed')"
        @click="inkStore.retrySaves()"
      >
        <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true">
          <path d="M6 15.5h8a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 6 15.5z" />
          <path d="M10 8.5v3M10 13.6v.1" />
        </svg>
      </button>
      <span
        v-else-if="inkStore.saveState !== 'idle'"
        class="inline-flex items-center justify-center text-gray-400 dark:text-gray-500"
        :title="$t(inkStore.saveState === 'saved' ? 'ink-saved' : 'ink-saving')"
      >
        <svg v-if="inkStore.saveState === 'saved'" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M6 15.5h8a3.5 3.5 0 0 0 .4-7 5 5 0 0 0-9.6 1.2A3 3 0 0 0 6 15.5z" />
          <path d="M7.8 11.6l1.6 1.5 2.9-3" />
        </svg>
        <span v-else class="size-1.5 rounded-full bg-current motion-safe:animate-pulse" aria-hidden="true" />
      </span>
      <span class="sr-only" role="status" aria-live="polite">{{ inkStore.saveState === 'error' ? $t('ink-save-failed') : '' }}</span>
    </div>
  </div>
</template>
