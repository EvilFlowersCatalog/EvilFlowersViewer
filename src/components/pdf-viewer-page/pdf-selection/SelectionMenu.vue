<script setup lang="ts">
// The menu for selected text. It sits inside the page, positioned in page
// fractions, so it scrolls and zooms with the text instead of chasing it. One
// prominent action (Explain, when the host offers it), the everyday ones as
// labelled buttons, nothing hidden. A toolbar: ←/→ move between actions.
import { computed, nextTick, onMounted, ref } from 'vue';
import type { IPageBox } from '@/assets/utils/interfaces';

export type SelectionMenuAction = 'explain' | 'highlight' | 'copy' | 'link' | 'ask' | 'search' | 'similar';

const props = defineProps<{
  /** The selection's lines on this page (page fractions). */
  boxes: IPageBox[];
  actions: SelectionMenuAction[];
  /** Brief confirmation (or failure) after Copy or Copy link. */
  feedback?: { action: 'copy' | 'link'; ok: boolean } | null;
}>();

const done = (action: SelectionMenuAction) => props.feedback?.action === action && props.feedback.ok;
const failed = (action: SelectionMenuAction) => props.feedback?.action === action && !props.feedback.ok;
const label = (action: SelectionMenuAction) =>
  done(action)
    ? action === 'link'
      ? 'link-copied'
      : 'copied'
    : failed(action)
      ? action === 'link'
        ? 'link-failed-short'
        : 'copy-failed'
      : LABELS[action];
const emit = defineEmits<{ action: [action: SelectionMenuAction] }>();

const root = ref<HTMLElement | null>(null);
const placeBelow = ref(false);

// Above the first line, centred on it; below the last line when the first
// sits too close to the top of the view (measured once it is on screen).
const first = computed(() => props.boxes[0]);
const last = computed(() => props.boxes[props.boxes.length - 1]);
const style = computed(() => {
  const box = placeBelow.value ? last.value : first.value;
  const center = (Math.min(...props.boxes.map((b) => b.x0)) + Math.max(...props.boxes.map((b) => b.x1))) / 2;
  return {
    left: `${Math.min(0.92, Math.max(0.08, center)) * 100}%`,
    top: `${(placeBelow.value ? box.y1 : box.y0) * 100}%`,
    transform: placeBelow.value ? 'translate(-50%, 8px)' : 'translate(-50%, calc(-100% - 8px))',
  };
});

onMounted(async () => {
  await nextTick();
  const rect = root.value?.getBoundingClientRect();
  const scroller = root.value?.closest('[data-page-scroll]')?.getBoundingClientRect();
  if (rect && scroller && rect.top < scroller.top + 4) placeBelow.value = true;
});

const LABELS: Record<SelectionMenuAction, string> = {
  explain: 'explain',
  highlight: 'highlight',
  copy: 'copy',
  link: 'copy-link',
  ask: 'ask',
  search: 'find-in-document',
  similar: 'similar',
};
const SHORTCUT: Partial<Record<SelectionMenuAction, string>> = { copy: 'Control+C Meta+C' };

// Roving focus inside the toolbar.
const onKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
  const buttons = [...(root.value?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
  const at = buttons.indexOf(document.activeElement as HTMLButtonElement);
  const next = buttons[(at + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
  next?.focus();
  event.preventDefault();
};

defineExpose({ focus: () => root.value?.querySelector<HTMLButtonElement>('button')?.focus() });
</script>

<template>
  <div
    ref="root"
    data-efv-float
    data-efv-selection-menu
    class="efv-selection-menu absolute z-30 flex items-center gap-0.5 p-1 rounded-[11px] select-none whitespace-nowrap"
    :style="style"
    role="toolbar"
    :aria-label="$t('selection-actions')"
    @pointerdown.prevent
    @keydown="onKeydown"
  >
    <template v-for="(action, index) in actions" :key="action">
      <span v-if="index === 1 && actions[0] === 'explain'" class="efv-selection-sep" aria-hidden="true" />
      <button
        type="button"
        class="efv-selection-btn"
        :class="{ 'efv-selection-primary': action === 'explain' }"
        :title="$t(LABELS[action])"
        :aria-label="$t(label(action))"
        :aria-keyshortcuts="SHORTCUT[action]"
        :tabindex="index === 0 ? 0 : -1"
        @click="emit('action', action)"
      >
        <!-- explain: sparkle -->
        <svg v-if="action === 'explain'" aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none">
          <path d="M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6L10 2.5z" fill="currentColor" />
          <path d="M15.5 13l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8z" fill="currentColor" opacity=".7" />
        </svg>
        <svg v-else-if="action === 'highlight'" aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none">
          <rect x="2.5" y="14" width="15" height="3.5" rx="1" fill="#ffd60a" />
          <path d="M12.5 2.8l3.7 3.7-6.9 6.9H5.6V9.7l6.9-6.9z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
        </svg>
        <svg v-else-if="action === 'link'" aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none">
          <path v-if="done('link')" d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          <template v-else>
            <path d="M8.5 11.5a3.2 3.2 0 0 0 4.6.2l2.6-2.6a3.2 3.2 0 0 0-4.6-4.6l-1 1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
            <path d="M11.5 8.5a3.2 3.2 0 0 0-4.6-.2l-2.6 2.6a3.2 3.2 0 0 0 4.6 4.6l1-1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </template>
        </svg>
        <svg v-else-if="action === 'copy'" aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none">
          <template v-if="done('copy')">
            <path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
          </template>
          <template v-else>
            <rect x="7" y="7" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.4" />
            <path d="M13 4.5V4a1.5 1.5 0 0 0-1.5-1.5h-7A1.5 1.5 0 0 0 3 4v7a1.5 1.5 0 0 0 1.5 1.5H5" stroke="currentColor" stroke-width="1.4" />
          </template>
        </svg>
        <svg v-else-if="action === 'ask'" aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none">
          <path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
        </svg>
        <svg v-else-if="action === 'search'" aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5" stroke="currentColor" stroke-width="1.5" />
          <path d="M12.5 12.5L17 17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <svg v-else aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none">
          <rect x="3" y="4" width="9" height="12" rx="1" stroke="currentColor" stroke-width="1.4" />
          <rect x="8.5" y="6.5" width="9" height="12" rx="1" stroke="currentColor" stroke-width="1.4" />
        </svg>
        <span :class="{ 'text-[#ff3b30]': failed(action) }">{{ $t(label(action)) }}</span>
      </button>
    </template>
  </div>
</template>

