<script setup lang="ts">
// A top-bar button whose tooltip names it and its shortcut, close to the
// pointer, so actions are learnt by using them.
defineProps<{
  label: string;
  shortcut?: string;
  active?: boolean;
  /** Show the label next to the icon (wide screens). */
  showLabel?: boolean;
}>();
const emit = defineEmits<{ click: [event: MouseEvent] }>();
</script>

<template>
  <span class="efv-bar-btn relative inline-flex">
    <button
      type="button"
      class="h-8 inline-flex items-center justify-center gap-1.5 rounded-[8px] text-[12.5px] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0077cc]"
      :class="[
        showLabel ? 'px-2.5' : 'w-8',
        active
          ? 'text-[#0077cc] bg-[#0077cc]/10'
          : 'text-[#3a3a3c] hover:text-black hover:bg-black/[0.06] dark:text-white/75 dark:hover:text-white dark:hover:bg-white/10',
      ]"
      :aria-label="label"
      :aria-keyshortcuts="shortcut"
      :aria-expanded="active"
      @click="emit('click', $event)"
    >
      <slot />
      <span v-if="showLabel">{{ label }}</span>
    </button>
    <span class="efv-tip" role="tooltip">
      {{ label }}<kbd v-if="shortcut">{{ shortcut }}</kbd>
    </span>
  </span>
</template>

<style scoped>
.efv-tip {
  position: absolute;
  top: calc(100% + 6px);
  left: 50%;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  font-size: 12px;
  color: #fff;
  background: rgba(30, 30, 32, 0.92);
  pointer-events: none;
  opacity: 0;
  transform: translate(-50%, -2px);
  transition: opacity 120ms ease, transform 120ms ease;
}
.efv-tip kbd {
  font: 500 10.5px/1 ui-sans-serif, system-ui, sans-serif;
  padding: 2px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.18);
}
.efv-bar-btn:hover .efv-tip {
  opacity: 1;
  transform: translate(-50%, 0);
  transition-delay: 350ms;
}
/* Keyboard users see the name and shortcut too (WCAG 1.4.13). */
.efv-bar-btn:has(button:focus-visible) .efv-tip {
  opacity: 1;
  transform: translate(-50%, 0);
}
/* A popover open under the button hides its tooltip. */
.efv-bar-btn:has(button[aria-expanded='true']) .efv-tip {
  display: none;
}
</style>
