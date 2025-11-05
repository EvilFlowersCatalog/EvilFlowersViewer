<script setup lang="ts">
interface ILoaderProps {
  size: number;
  color: string;
}
// Props
const { size, color } = defineProps<ILoaderProps>();
</script>

<template>
  <div class="w-full h-full flex justify-center items-center">
    <div class="flex justify-center items-center z-40">
      <div
        class="w-14 h-14 border-t-4 border-solid rounded-full animate-spin"
        :style="{ width: `${size}px`, height: `${size}px`, borderColor: color }"
      ></div>
    </div>
  </div>
</template>
