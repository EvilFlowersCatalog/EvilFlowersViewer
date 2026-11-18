<script setup lang="ts">
// What the reader can do with the selected marks, shown right at them:
// colour, width, a note, order, duplicate, delete. "Actions open where
// invoked" (docs: UX direction): never a panel across the screen.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { colors } from '@/assets/utils/constans';
import { useInkStore } from '@/stores';
import type { InkBox, InkSpace } from '@/core/annotations';

const props = defineProps<{
  page: number;
  space: InkSpace;
  box: InkBox;
  /** Open the note editor at once (a note was just placed). */
  openNote: boolean;
}>();
const emit = defineEmits<{ 'note-closed': [] }>();

const inkStore = useInkStore();
const objects = computed(() => inkStore.selectedObjects);
const single = computed(() => (objects.value.length === 1 ? objects.value[0] : null));
const editable = computed(() => objects.value.filter((o) => o.kind !== 'raw'));

const hasWidth = computed(() => editable.value.some((o) => o.kind !== 'mark' && o.kind !== 'note'));
const width = computed(() => editable.value.find((o) => o.kind !== 'mark' && o.kind !== 'note')?.width ?? 2);
const color = computed(() => editable.value[0]?.color ?? null);

const setWidth = (delta: number) => {
  const next = Math.max(0.5, Math.min(40, Math.round((width.value + delta) * 2) / 2));
  inkStore.styleSelection({ width: next });
};

// ---- note ----------------------------------------------------------------------
// The draft belongs to the object it was opened for. It is saved when the
// editor closes, on blur, when the selection moves to another object and
// when the inspector goes away; a click on the page keeps the textarea
// focused (no blur), so blur alone would lose it.
const noteOpen = ref(props.openNote);
const draft = ref(single.value?.note ?? '');
const draftFor = ref<{ page: number; id: string } | null>(single.value ? { page: props.page, id: single.value.id } : null);
const field = ref<HTMLTextAreaElement | null>(null);

const saveDraft = () => {
  if (draftFor.value) inkStore.setNote(draftFor.value.page, draftFor.value.id, draft.value.trim());
};

watch(
  () => single.value?.id,
  () => {
    saveDraft();
    const o = single.value;
    draft.value = o?.note ?? '';
    draftFor.value = o ? { page: props.page, id: o.id } : null;
    if (!o) noteOpen.value = false;
  }
);
onBeforeUnmount(saveDraft);
watch(
  () => props.openNote,
  (open) => open && openNoteEditor()
);

const openNoteEditor = async () => {
  noteOpen.value = true;
  await nextTick();
  field.value?.focus();
};
if (props.openNote) void openNoteEditor();

const saveNote = saveDraft;
const closeNote = () => {
  saveNote();
  noteOpen.value = false;
  emit('note-closed');
};

// ---- placement -------------------------------------------------------------------
// Above the selection; below it when the selection is near the page's top.
const below = computed(() => props.box.y / props.space.h < 0.12);
const style = computed(() => ({
  left: `${((props.box.x + props.box.w / 2) / props.space.w) * 100}%`,
  top: below.value
    ? `calc(${((props.box.y + props.box.h) / props.space.h) * 100}% + 10px)`
    : `calc(${(props.box.y / props.space.h) * 100}% - 10px)`,
  transform: below.value ? 'translateX(-50%)' : 'translate(-50%, -100%)',
}));

const btn =
  'size-7 inline-flex items-center justify-center rounded-md text-[13px] hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary';
</script>

<template>
  <div
    class="efv-ink-inspector absolute z-[12] flex flex-col gap-1.5 p-1.5 rounded-xl bg-white/95 dark:bg-[#232323]/95 text-gray-800 dark:text-gray-100 shadow-[0_6px_24px_rgba(0,0,0,0.18)] ring-1 ring-black/5 dark:ring-white/10 backdrop-blur"
    :style="style"
    role="toolbar"
    :aria-label="$t('ink-selection', { count: objects.length })"
    @pointerdown.stop
  >
    <div class="flex items-center gap-1">
      <!-- Colours -->
      <template v-if="editable.length">
        <button
          v-for="c of colors"
          :key="c.value"
          type="button"
          class="size-5 rounded-full ring-1 ring-black/10 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          :class="color === c.value ? 'ring-2 ring-offset-1 ring-gray-500 dark:ring-offset-[#232323]' : ''"
          :style="{ backgroundColor: c.value }"
          :aria-label="`${$t('select-color')} ${c.value}`"
          :aria-pressed="color === c.value"
          @click="inkStore.styleSelection({ color: c.value })"
        />
        <span class="w-px h-5 bg-black/10 dark:bg-white/15 mx-0.5" aria-hidden="true" />
      </template>

      <!-- Width -->
      <template v-if="hasWidth">
        <button type="button" :class="btn" :aria-label="$t('ink-thinner')" :title="$t('ink-thinner')" @click="setWidth(-0.5)">−</button>
        <span class="min-w-[2.25rem] text-center text-[12px] tabular-nums" aria-live="polite">{{ width }} pt</span>
        <button type="button" :class="btn" :aria-label="$t('ink-thicker')" :title="$t('ink-thicker')" @click="setWidth(0.5)">+</button>
        <span class="w-px h-5 bg-black/10 dark:bg-white/15 mx-0.5" aria-hidden="true" />
      </template>

      <!-- Note -->
      <button
        v-if="single && single.kind !== 'raw'"
        type="button"
        :class="[btn, noteOpen || single.note ? 'text-accent-ink bg-accent-soft' : '']"
        :aria-label="$t('ink-note')"
        :title="$t('ink-note')"
        :aria-expanded="noteOpen"
        @click="noteOpen ? closeNote() : openNoteEditor()"
      >
        <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <path d="M4 3.5h12a1 1 0 0 1 1 1v8.2L12.7 17H4a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" stroke-linejoin="round" />
          <path d="M12.5 17v-3.5a1 1 0 0 1 1-1H17M6.5 7.5h7M6.5 10.5h4.5" stroke-linecap="round" />
        </svg>
      </button>
      <button type="button" :class="btn" :aria-label="$t('ink-front')" :title="$t('ink-front')" @click="inkStore.bringToFront()">
        <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">
          <path d="M10 3l7 3.8-7 3.8-7-3.8z" fill="currentColor" fill-opacity="0.35" />
          <path d="M3 10.2l7 3.8 7-3.8M3 13.6l7 3.8 7-3.8" />
        </svg>
      </button>
      <button type="button" :class="btn" :aria-label="$t('ink-duplicate')" :title="`${$t('ink-duplicate')} (⌘D)`" @click="inkStore.duplicateSelection()">
        <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <path d="M13 4.5V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h.5" stroke-linecap="round" />
        </svg>
      </button>
      <button type="button" :class="[btn, 'hover:text-red-600']" :aria-label="$t('delete')" :title="`${$t('delete')} (⌫)`" @click="inkStore.deleteSelection()">
        <svg viewBox="0 0 20 20" class="size-4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">
          <path d="M4 5.5h12M8 5.5V4h4v1.5M5.5 5.5l.7 10.1a1 1 0 0 0 1 .9h5.6a1 1 0 0 0 1-.9l.7-10.1" />
        </svg>
      </button>
    </div>

    <!-- The note, and what the mark sits on -->
    <div v-if="noteOpen && single" class="flex flex-col gap-1 w-[260px] max-w-[70vw]">
      <textarea
        ref="field"
        v-model="draft"
        rows="3"
        class="w-full resize-y rounded-md border border-efv-border bg-white dark:bg-[#1b1b1b] px-2 py-1.5 text-[13px] leading-snug focus:outline-none focus:ring-2 focus:ring-secondary"
        :placeholder="$t('ink-note-placeholder')"
        :aria-label="$t('ink-note')"
        @blur="saveNote"
        @keydown.esc.stop.prevent="closeNote"
        @keydown.enter.meta.prevent="closeNote"
        @keydown.enter.ctrl.prevent="closeNote"
      />
      <p v-if="single.text" class="text-[11px] leading-snug text-gray-500 dark:text-gray-400 line-clamp-2" :title="single.text">
        {{ $t('ink-on-text') }} „{{ single.text }}“
      </p>
    </div>
  </div>
</template>
