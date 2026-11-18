<script setup lang="ts">
import {
  colors,
  MIN_TOOL_SIZE,
  MAX_TOOL_SIZE,
  INTERVAL,
} from '@/assets/utils/constans';
import { useDocumentStore } from '@/stores';
import { useId } from 'vue';

const docStore = useDocumentStore();
const sizeId = useId();
</script>

<template>
  <!-- Wrapper -->
  <div
    class="w-[133px] bg-white dark:bg-[#1E1E1E] rounded-md cursor-default text-gray-800 dark:text-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]"
  >
    <!-- Container -->
    <div class="flex flex-col p-[7px] gap-2 text-left">
      <!-- Width -->
      <div class="flex flex-col gap-1">
        <label :for="sizeId" class="text-[10px] font-medium">
          {{ $t('size') }}: <output :for="sizeId">{{ docStore.toolSize }}</output>
        </label>
        <!-- Native range: keyboard (arrows, Home/End, PageUp/Down), touch and
             screen readers for free, no slider library in the bundle. -->
        <input
          :id="sizeId"
          v-model.number="docStore.toolSize"
          type="range"
          class="efv-range my-1"
          :min="MIN_TOOL_SIZE"
          :max="MAX_TOOL_SIZE"
          :step="INTERVAL"
        />
      </div>

      <!-- Colors -->
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-medium">{{ $t('colors') }}</span>
        <div class="grid grid-cols-3 gap-x-[12px] gap-y-[7px] px-[5px] py-1">
          <button
            v-for="color of colors"
            :key="color.value"
            type="button"
            class="size-[27px] rounded-[5px] border-2 cursor-pointer shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]"
            :class="
              docStore.toolColor === color.value
                ? 'border-white ring-1 ring-gray-300'
                : 'border-transparent'
            "
            :style="{ backgroundColor: color.value }"
            :aria-label="`${$t('select-color')} ${color.value}`"
            :aria-pressed="docStore.toolColor === color.value"
            @click="docStore.toolColor = color.value"
          ></button>
        </div>
      </div>
    </div>
  </div>
</template>

