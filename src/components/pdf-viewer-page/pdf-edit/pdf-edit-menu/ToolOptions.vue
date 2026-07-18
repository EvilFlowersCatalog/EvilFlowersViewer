<script setup lang="ts">
import {
  colors,
  MIN_TOOL_SIZE,
  MAX_TOOL_SIZE,
  INTERVAL,
} from '@/assets/utils/constans';
import { useDocumentStore } from '@/stores';
import { ref } from 'vue';
import VueSlider from 'vue-3-slider-component';

const docStore = useDocumentStore();
const value = ref(docStore.toolSize);
</script>

<template>
  <!-- Wrapper -->
  <div
    class="absolute top-full right-0 mt-[7px] w-[133px] bg-white dark:bg-[#1E1E1E] rounded-md cursor-default text-gray-800 dark:text-white shadow-[0px_4px_12px_0px_rgba(0,0,0,0.1)]"
  >
    <!-- Container -->
    <div class="flex flex-col p-[7px] gap-2 text-left">
      <!-- Width -->
      <div class="flex flex-col gap-1">
        <span class="text-[10px] font-medium">{{ $t('size') }}: {{ value }}</span>
        <VueSlider
          v-model="value"
          :min="MIN_TOOL_SIZE"
          :max="MAX_TOOL_SIZE"
          :interval="INTERVAL"
          :height="4"
          :dot-size="12"
          :rail-style="{ backgroundColor: 'var(--efv-border)', borderRadius: '40px' }"
          :process-style="{ backgroundColor: 'var(--efv-primary)', borderRadius: '40px' }"
          :dot-style="{
            backgroundColor: 'var(--efv-primary-strong)',
            border: 'none',
            boxShadow: 'none',
          }"
          clickable
          dragOnClick
          silent
          class="tool-size-slider !my-1"
          @change="(e: number) => docStore.toolSize = e"
          tooltip="none"
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

