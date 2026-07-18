<script setup lang="ts">
interface ILoaderProps {
  size: number;
  color: string;
  /** Accessible status text announced by screen readers. */
  label?: string;
}
// Props
const { size, color, label } = defineProps<ILoaderProps>();
</script>

<template>
  <div
    class="w-full h-full flex justify-center items-center"
    role="status"
    aria-live="polite"
  >
    <div class="flex justify-center items-center z-40">
      <div
        class="w-14 h-14 border-t-4 border-solid rounded-full animate-spin"
        :style="{ width: `${size}px`, height: `${size}px`, borderColor: color }"
        aria-hidden="true"
      ></div>
    </div>
    <span class="sr-only">{{ label ?? 'Loading…' }}</span>
  </div>
</template>
