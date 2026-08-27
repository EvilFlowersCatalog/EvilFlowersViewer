<script setup lang="ts">
// The shelf/bookmark flag from the Figma source of truth — same path the
// suggestion cards use, shared here so the page corner button and the
// thumbnail strip can never drift from it.
withDefaults(
  defineProps<{
    filled?: boolean;
    /** Stroke colour when not filled; the accent blue is used when filled. */
    color?: string;
    width?: number;
    height?: number;
  }>(),
  { filled: false, color: '#333333', width: 10, height: 13 }
);

const ACCENT = '#0077cc';
</script>

<template>
  <svg
    :width="width"
    :height="height"
    viewBox="0 0 14 18"
    fill="none"
    aria-hidden="true"
  >
    <path
      :stroke="filled ? ACCENT : color"
      :fill="filled ? ACCENT : 'none'"
      d="M12.8333 16.5L6.99999 12.3333L1.16666 16.5V3.16667C1.16666 2.72464 1.34225 2.30072 1.65481 1.98816C1.96737 1.67559 2.3913 1.5 2.83332 1.5H11.1667C11.6087 1.5 12.0326 1.67559 12.3452 1.98816C12.6577 2.30072 12.8333 2.72464 12.8333 3.16667V16.5Z"
      stroke-width="1.25"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
