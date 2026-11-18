<script setup lang="ts">
// Sticky notes while reading: each pin is a button on the page that opens
// its note right there. The note belongs next to the passage, not in a list
// somewhere else. (In draw mode the pins are ink objects like any other.)
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { EDIT_TOOL } from '@/assets/utils/enums';
import { useDocumentStore, useInkStore, useViewerStore } from '@/stores';
import type { InkNote, InkSpace } from '@/core/annotations';

const props = defineProps<{ page: number; space: InkSpace }>();
/** "Edit" on a note: the layer opens it in the inspector. */
const emit = defineEmits<{ edit: [id: string] }>();

const docStore = useDocumentStore();
const inkStore = useInkStore();
const viewerStore = useViewerStore();

const reading = computed(() => !docStore.drawMode || docStore.editTool === EDIT_TOOL.MOUSE);
const notes = computed(() => inkStore.objectsOn(props.page).filter((o): o is InkNote => o.kind === 'note'));

// Only one note open at a time, and only while reading.
const shownId = ref<string | null>(null);
const shown = computed(() => notes.value.find((n) => n.id === shownId.value) ?? null);
watch(reading, (r) => !r && (shownId.value = null));

const toggle = (id: string) => (shownId.value = shownId.value === id ? null : id);

const canEdit = computed(() => !!(viewerStore.config.edit && viewerStore.editPackage && !docStore.isMobile));
const edit = (note: InkNote) => {
  shownId.value = null;
  docStore.setDrawMode(true);
  docStore.editTool = EDIT_TOOL.SELECT;
  inkStore.select(props.page, [note.id]);
  emit('edit', note.id);
};

const pct = (n: number, of: number) => `${(n / of) * 100}%`;

const root = ref<HTMLElement | null>(null);
const onOutside = (event: PointerEvent) => {
  if (root.value && !root.value.contains(event.target as Node)) shownId.value = null;
};
watch(shownId, (id) => {
  if (id) document.addEventListener('pointerdown', onOutside, true);
  else document.removeEventListener('pointerdown', onOutside, true);
});
onBeforeUnmount(() => document.removeEventListener('pointerdown', onOutside, true));
</script>

<template>
  <div v-if="reading && notes.length" ref="root" class="contents">
    <button
      v-for="note in notes"
      :key="note.id"
      type="button"
      class="absolute z-[6] rounded-[4px] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      :style="{
        left: pct(note.x, space.w),
        top: pct(note.y, space.h),
        width: pct(note.size, space.w),
        height: pct(note.size, space.h),
      }"
      :aria-label="note.note ? `${$t('ink-note')}: ${note.note}` : $t('ink-note')"
      :aria-expanded="shownId === note.id"
      :title="note.note || $t('ink-note')"
      @click="toggle(note.id)"
    />
    <div
      v-if="shown"
      class="absolute z-[12] w-[260px] max-w-[70vw] p-3 rounded-xl bg-[#fffbe0] dark:bg-[#3a3520] text-gray-900 dark:text-gray-100 shadow-[0_6px_24px_rgba(0,0,0,0.18)] ring-1 ring-black/10"
      :style="{
        // Beside the pin, on the side of the page with room for it.
        ...(shown.x > space.w * 0.55
          ? { right: pct(space.w - shown.x + space.w * 0.01, space.w) }
          : { left: pct(shown.x + shown.size + space.w * 0.01, space.w) }),
        top: pct(shown.y, space.h),
      }"
      role="dialog"
      :aria-label="$t('ink-note')"
    >
      <p class="text-[13px] leading-snug whitespace-pre-wrap break-words">{{ shown.note || $t('ink-note-empty') }}</p>
      <p v-if="shown.text" class="mt-2 text-[11px] leading-snug text-gray-600 dark:text-gray-400 line-clamp-2">
        {{ $t('ink-on-text') }} „{{ shown.text }}“
      </p>
      <button
        v-if="canEdit"
        type="button"
        class="mt-2 text-[12px] font-medium text-accent-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded"
        @click="edit(shown)"
      >
        {{ $t('ink-edit-note') }}
      </button>
    </div>
  </div>
</template>
