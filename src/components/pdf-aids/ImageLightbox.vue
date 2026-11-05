<script setup lang="ts">
// Full-screen view of one image (a figure or table crop). Closes on Escape, on
// the close button and on a click beside the image.
import { inject, onMounted, ref, type Ref } from 'vue';
import { useEscapeLayer } from './useEscapeLayer';
import Loader from './Loader.vue';

defineProps<{ src: string | null; caption?: string | null; loading?: boolean }>();
const emit = defineEmits<{ close: [] }>();

const layer = inject<Ref<HTMLElement | null>>('floatLayer', ref(null));
const closeButton = ref<HTMLButtonElement | null>(null);

useEscapeLayer(() => true, () => emit('close'));
onMounted(() => closeButton.value?.focus());
</script>

<template>
  <Teleport :to="layer" :disabled="!layer">
    <div
      class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-6 bg-black/85 cursor-zoom-out"
      role="dialog"
      aria-modal="true"
      @click.self="emit('close')"
    >
      <img
        v-if="src"
        :src="src"
        :alt="caption ?? ''"
        class="min-h-0 max-w-full max-h-full object-contain rounded bg-white shadow-2xl cursor-auto"
      />
      <div v-if="loading" class="absolute top-4 left-4 size-10 pointer-events-none">
        <Loader :size="28" color="#ffffff" />
      </div>
      <p v-if="caption" class="shrink-0 max-w-[900px] text-center text-[13px] leading-[18px] text-white/85 cursor-auto">
        {{ caption }}
      </p>
      <button
        ref="closeButton"
        type="button"
        class="absolute top-4 right-4 p-2 rounded-full text-white/80 hover:text-white bg-white/10 hover:bg-white/20"
        :aria-label="$t('close')"
        @click="emit('close')"
      >
        <svg aria-hidden="true" class="size-5" viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>
    </div>
  </Teleport>
</template>
