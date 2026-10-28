<script setup lang="ts">
// One attachment of a chat message: a selection, an explanation, a region or
// an agent highlight. Clicking it jumps to where it came from in the book.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { IChatContext } from '@/assets/utils/interfaces';
import { useAssistantStore, useDocumentStore } from '@/stores';

const props = defineProps<{ context: IChatContext; removable?: boolean; inverted?: boolean }>();
const emit = defineEmits<{ remove: [] }>();

const { t } = useI18n();
const docStore = useDocumentStore();
const assistantStore = useAssistantStore();

const clip = (text: string, max = 48) => (text.length > max ? `${text.slice(0, max)}…` : text);

const info = computed(() => {
  const ctx = props.context;
  switch (ctx.kind) {
    case 'selection':
      return { icon: 'M5 4h10M5 8h10M5 12h6', label: `„${clip(ctx.text)}“`, page: ctx.page };
    case 'explain':
      return { icon: 'M10 14v-.01M8.3 8a1.9 1.9 0 1 1 2.6 1.76c-.66.28-.9.7-.9 1.24', label: `${t('explain')}: „${clip(ctx.text, 36)}“`, page: ctx.page };
    case 'region':
      return {
        icon: 'M3 5h14v10H3z',
        label: `${t(`region-${ctx.region.kind}`)}${ctx.region.caption ? `: ${clip(ctx.region.caption, 36)}` : ''}`,
        page: ctx.region.page,
      };
    case 'highlight':
      return { icon: 'M4 4h12v9H9l-4 3v-3H4z', label: `#${ctx.highlight.seq} „${clip(ctx.highlight.text, 36)}“`, page: ctx.highlight.page };
  }
});

const jump = () => {
  const ctx = props.context;
  if (ctx.kind === 'region') assistantStore.goToRegion(ctx.region);
  else if (ctx.kind === 'highlight') assistantStore.goToHighlight(ctx.annotationId, ctx.highlight);
  else docStore.activePage = ctx.page;
};
</script>

<template>
  <span
    class="inline-flex items-center max-w-full gap-1 pl-1.5 pr-1 py-0.5 rounded-[5px] text-[10px] leading-[14px]"
    :class="inverted ? 'bg-white/20 text-white' : 'bg-accent-soft text-accent-ink'"
  >
    <button type="button" class="flex items-center gap-1 min-w-0" :title="info.label" @click="jump">
      <svg aria-hidden="true" class="size-3 shrink-0" viewBox="0 0 20 20" fill="none">
        <path :d="info.icon" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <span class="truncate">{{ info.label }}</span>
      <span class="shrink-0 opacity-70">· {{ $t('page-short', { page: info.page }) }}</span>
    </button>
    <button
      v-if="removable"
      type="button"
      class="shrink-0 p-0.5 rounded hover:bg-black/10"
      :aria-label="$t('remove')"
      @click="emit('remove')"
    >
      <svg aria-hidden="true" class="size-2.5" viewBox="0 0 20 20" fill="none">
        <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </button>
  </span>
</template>
