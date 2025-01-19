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
    class="absolute top-0 right-12 bg-primary rounded-md cursor-default text-white"
  >
    <!-- Container -->
    <div class="flex flex-col w-full h-full p-4 gap-4 text-left">
      <!-- Width -->
      <div class="w-full flex flex-col gap-2">
        <span class="text-sm font-bold">{{ $t('size') }}: {{ value }}</span>
        <VueSlider
          v-model="value"
          :min="MIN_TOOL_SIZE"
          :max="MAX_TOOL_SIZE"
          :interval="INTERVAL"
          clickable
          dragOnClick
          silent
          class="bg-secondary rounded-md"
          @change="(e: number) => docStore.setToolSize(e)"
          tooltip="none"
        >
          <template #dot="{ value }">
            <div class="w-full h-full rounded-full bg-white"></div> </template
        ></VueSlider>
      </div>

      <!-- Colors -->
      <div class="flex flex-col gap-2">
        <span class="text-sm font-bold">{{ $t('colors') }}</span>
        <div class="grid grid-cols-3 w-40 h-40 gap-1 bg-white p-1 rounded-md">
          <div
            v-for="color of colors"
            :key="color.value"
            class="w-full h-full rounded-md border-4 cursor-pointer"
            :class="{
              [color.color]: true,
              'border-white': docStore.toolColor === color.value,
              'border-transparent': docStore.toolColor !== color.value,
            }"
            @click="docStore.setToolColor(color.value)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
