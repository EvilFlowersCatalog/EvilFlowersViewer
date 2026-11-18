<script setup lang="ts">
// A card that drops from the button that opened it: the action happens where
// the reader asked for it. Title with its keyboard shortcut, a close, content.
defineProps<{ title: string; shortcut?: string; width?: number }>();
const emit = defineEmits<{ close: [] }>();
</script>

<template>
  <div
    class="efv-popover absolute right-0 top-[calc(100%+8px)] z-40 flex flex-col max-h-[calc(100vh-80px)] rounded-[14px] overflow-hidden"
    :style="{ width: `${width ?? 380}px`, maxWidth: 'calc(100vw - 24px)' }"
    role="dialog"
    :aria-label="title"
    @keydown.stop
  >
    <div class="flex items-center gap-2 pl-4 pr-2 pt-3 pb-2">
      <h2 class="flex-1 text-[15px] font-semibold tracking-[-0.01em]">{{ title }}</h2>
      <kbd v-if="shortcut" class="efv-kbd">{{ shortcut }}</kbd>
      <button
        type="button"
        class="size-7 inline-flex items-center justify-center rounded-full text-[#8e8e93] hover:bg-black/[0.06] dark:hover:bg-white/10"
        :aria-label="$t('close')"
        @click="emit('close')"
      >
        <svg aria-hidden="true" width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" /></svg>
      </button>
    </div>
    <div class="min-h-0 overflow-auto px-4 pb-4">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.efv-popover {
  background: #fff;
  color: #1d1d1f;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.06);
  animation: efv-pop 140ms ease-out;
}
.dark .efv-popover {
  background: #232325;
  color: #f2f2f7;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08);
}
.efv-kbd {
  font: 500 11px/1 ui-sans-serif, system-ui, sans-serif;
  padding: 3px 6px;
  border-radius: 5px;
  color: #6e6e73;
  background: rgba(0, 0, 0, 0.05);
}
.dark .efv-kbd {
  color: #aeaeb2;
  background: rgba(255, 255, 255, 0.08);
}
@keyframes efv-pop {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
}
</style>
