<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  anchorRect: DOMRect;
  showSimilar: boolean;
  showHighlight: boolean;
  showExplain: boolean;
}>();

const emit = defineEmits<{
  copy: [];
  similar: [];
  highlight: [];
  explain: [];
}>();

// Centered above the selection; flips below when too close to the viewport top.
const style = computed(() => {
  const gap = 8;
  const flip = props.anchorRect.top < 60;
  return {
    left: `${props.anchorRect.left + props.anchorRect.width / 2}px`,
    top: flip
      ? `${props.anchorRect.bottom + gap}px`
      : `${props.anchorRect.top - gap}px`,
    transform: flip ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
  };
});
</script>

<template>
  <div
    class="fixed z-30 flex items-stretch gap-[2px] px-[6px] py-[6px] rounded-[8px] bg-[#333333] shadow-[0px_4px_10px_rgba(0,0,0,0.35)]"
    :style="style"
    role="menu"
  >
    <button
      type="button"
      class="flex flex-col items-center gap-[3px] px-[10px] py-[2px] rounded-[5px] text-white/90 hover:bg-white/10 hover:text-white transition-colors"
      role="menuitem"
      @click="emit('copy')"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="7" y="7" width="10" height="10" rx="1.5" stroke="currentColor" stroke-width="1.4" />
        <path d="M4 13V4.5A1.5 1.5 0 0 1 5.5 3H13" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
      </svg>
      <span class="text-[9px] font-normal whitespace-nowrap">{{ $t('copy') }}</span>
    </button>

    <button
      v-if="showSimilar"
      type="button"
      class="flex flex-col items-center gap-[3px] px-[10px] py-[2px] rounded-[5px] text-white/90 hover:bg-white/10 hover:text-white transition-colors"
      role="menuitem"
      @click="emit('similar')"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="4" width="9" height="12" rx="1" stroke="currentColor" stroke-width="1.4" />
        <rect x="8.5" y="6.5" width="9" height="12" rx="1" fill="#333333" stroke="currentColor" stroke-width="1.4" />
      </svg>
      <span class="text-[9px] font-normal whitespace-nowrap">{{ $t('similar') }}</span>
    </button>

    <button
      v-if="showHighlight"
      type="button"
      class="flex flex-col items-center gap-[3px] px-[10px] py-[2px] rounded-[5px] text-white/90 hover:bg-white/10 hover:text-white transition-colors"
      role="menuitem"
      @click="emit('highlight')"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M4 16.5h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        <path d="M12.5 3.5 16.5 7.5 8 16 4 12z" fill="currentColor" fill-opacity="0.3" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" />
      </svg>
      <span class="text-[9px] font-normal whitespace-nowrap">{{ $t('highlight') }}</span>
    </button>

    <button
      v-if="showExplain"
      type="button"
      class="flex flex-col items-center gap-[3px] px-[10px] py-[2px] rounded-[5px] text-white/90 hover:bg-white/10 hover:text-white transition-colors"
      role="menuitem"
      @click="emit('explain')"
    >
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4" />
        <path d="M10 14v-.01M8.3 8a1.9 1.9 0 1 1 2.6 1.76c-.66.28-.9.7-.9 1.24" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="text-[9px] font-normal whitespace-nowrap">{{ $t('explain') }}</span>
    </button>
  </div>
</template>
