<script setup lang="ts">
// Options of the tool in hand: which shape, its colour and width. Each tool
// remembers its own (a yellow highlighter stays yellow when the pen is black).
import { computed, useId } from 'vue';
import { colors } from '@/assets/utils/constans';
import { EDIT_TOOL } from '@/assets/utils/enums';
import { useDocumentStore, useInkStore } from '@/stores';
import { SHAPES, TOOL_ICONS } from './tools';

const docStore = useDocumentStore();
const inkStore = useInkStore();
const sizeId = useId();

const style = computed(() => inkStore.currentStyle);
const isShape = computed(() => docStore.editTool === EDIT_TOOL.SHAPE);
const hasWidth = computed(() => docStore.editTool !== EDIT_TOOL.NOTE);
const max = computed(() => (docStore.editTool === EDIT_TOOL.HIGHLIGHTER ? 30 : 12));
const min = computed(() => (docStore.editTool === EDIT_TOOL.HIGHLIGHTER ? 4 : 0.5));
</script>

<template>
  <div
    v-if="style"
    class="w-[180px] p-2.5 flex flex-col gap-2.5 rounded-xl bg-white dark:bg-[#1E1E1E] text-gray-800 dark:text-white shadow-[0_6px_24px_rgba(0,0,0,0.18)] ring-1 ring-black/5 dark:ring-white/10 cursor-default text-left"
  >
    <!-- Shape -->
    <div v-if="isShape" class="grid grid-cols-4 gap-1" role="radiogroup" :aria-label="$t('tool-shape')">
      <button
        v-for="shape of SHAPES"
        :key="shape.kind"
        type="button"
        role="radio"
        class="h-8 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        :class="inkStore.shapeKind === shape.kind ? 'bg-accent-soft text-accent-ink' : ''"
        :aria-checked="inkStore.shapeKind === shape.kind"
        :aria-label="$t(shape.label)"
        :title="$t(shape.label)"
        @click="inkStore.shapeKind = shape.kind"
      >
        <span aria-hidden="true" v-html="TOOL_ICONS[shape.kind]" />
      </button>
    </div>

    <!-- Width -->
    <div v-if="hasWidth" class="flex flex-col gap-1">
      <label :for="sizeId" class="text-[11px] font-medium flex justify-between">
        <span>{{ $t('size') }}</span>
        <output :for="sizeId" class="tabular-nums text-gray-500">{{ style.width }} pt</output>
      </label>
      <input :id="sizeId" v-model.number="style.width" type="range" class="efv-range" :min="min" :max="max" step="0.5" />
    </div>

    <!-- Colours -->
    <div class="grid grid-cols-5 gap-1.5" role="radiogroup" :aria-label="$t('colors')">
      <button
        v-for="color of colors"
        :key="color.value"
        type="button"
        role="radio"
        class="size-6 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        :class="style.color === color.value ? 'ring-2 ring-offset-2 ring-gray-500 dark:ring-offset-[#1E1E1E]' : ''"
        :style="{ backgroundColor: color.value }"
        :aria-label="`${$t('select-color')} ${color.value}`"
        :aria-checked="style.color === color.value"
        @click="style.color = color.value"
      />
    </div>
  </div>
</template>
