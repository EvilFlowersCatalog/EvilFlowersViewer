<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { IChatMessage } from '@/assets/utils/interfaces';
import { renderMarkdown } from '@/assets/utils/markdown';
import { useAssistantStore, useDocumentStore } from '@/stores';
import { Loader } from '@/components/pdf-aids';
import SuggestionEntryItem from '@/components/pdf-viewer-page/pdf-suggestions/SuggestionEntryItem.vue';
import ContextChip from './ContextChip.vue';

const props = defineProps<{ message: IChatMessage }>();

const { t } = useI18n();
const docStore = useDocumentStore();
const assistantStore = useAssistantStore();

const html = computed(() =>
  renderMarkdown(props.message.text, {
    page: (page) => t('page-short', { page }),
    region: (id) => {
      const region = assistantStore.findRegion(id);
      return region ? t(`region-${region.kind}`) : t('region-figure');
    },
  })
);

// Citations are rendered as plain buttons inside v-html; one delegated handler.
const goToPage = (page: number) => {
  docStore.activePage = Math.min(Math.max(1, page), docStore.totalPages);
};

// Highlight layers the assistant created with this answer, as the layer list knows them.
const annotations = computed(() =>
  (props.message.annotationIds ?? []).map(
    (id) => assistantStore.allAnnotations.find((a) => a.id === id) ?? { id, title: '', status: 'pending' as const, highlights: [] }
  )
);

const onClick = (event: MouseEvent) => {
  const cite = (event.target as HTMLElement).closest<HTMLElement>('.efv-cite');
  if (!cite) return;
  const page = cite.dataset.page;
  const regionId = cite.dataset.region;
  if (page) {
    goToPage(Number(page));
  } else if (regionId) {
    const region = assistantStore.findRegion(regionId);
    if (region) assistantStore.goToRegion(region);
  }
};
</script>

<template>
  <!-- Reader -->
  <div v-if="message.role === 'user'" class="self-end max-w-[85%] flex flex-col items-end gap-1">
    <div v-if="message.contexts?.length" class="flex flex-wrap justify-end gap-1">
      <ContextChip v-for="(ctx, index) in message.contexts" :key="index" :context="ctx" />
    </div>
    <div class="px-3 py-2 rounded-[10px_10px_2px_10px] bg-secondary text-white text-[12px] leading-[17px] whitespace-pre-wrap break-words">
      {{ message.text }}
    </div>
  </div>

  <!-- Assistant -->
  <div v-else class="self-start max-w-[92%] flex flex-col gap-2">
    <div
      class="px-3 py-2 rounded-[10px_10px_10px_2px] bg-field text-[#222] dark:bg-white/5 dark:text-gray-100 text-[12px] leading-[17px] break-words"
    >
      <div v-if="message.status === 'streaming' && !message.text" class="flex items-center gap-2 text-efv-muted">
        <span class="size-4 inline-flex shrink-0"><Loader :size="14" color="#0077cc" :label="$t('chat-thinking')" /></span>
        <span class="text-[11px]">{{ $t('chat-thinking') }}</span>
      </div>
      <p v-else-if="message.status === 'error' && !message.text" class="text-[11px] text-red">
        {{ $t('chat-error') }}
      </p>
      <!-- eslint-disable-next-line vue/no-v-html -- sanitized by renderMarkdown -->
      <div v-else class="efv-md" :class="{ 'text-red': message.status === 'error' }" v-html="html" @click="onClick" />
    </div>

    <!-- Pages the answer was drawn from -->
    <div v-if="message.pages?.length" class="flex flex-wrap items-center gap-1 text-[10px] text-efv-muted">
      <span>{{ $t('chat-sources') }}:</span>
      <button v-for="page in message.pages" :key="page" type="button" class="efv-cite" @click="goToPage(page)">
        {{ $t('page-short', { page }) }}
      </button>
    </div>

    <!-- AI highlights the assistant created (create_highlights tool) -->
    <button
      v-for="annotation in annotations"
      :key="annotation.id"
      type="button"
      class="flex items-center gap-2 px-2.5 py-2 rounded-[8px] bg-white dark:bg-white/5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] text-left hover:brightness-95 disabled:cursor-default"
      :disabled="annotation.status !== 'done'"
      @click="assistantStore.openAnnotation(annotation.id)"
    >
      <span class="size-4 inline-flex shrink-0 items-center justify-center">
        <Loader v-if="annotation.status === 'pending'" :size="14" color="#0077cc" :label="$t('chat-highlights-pending')" />
        <svg v-else aria-hidden="true" class="size-4 text-accent-ink" viewBox="0 0 20 20" fill="none">
          <path d="M4 15h12M6 12l6-6 2 2-6 6H6v-2z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="flex-1 min-w-0">
        <span class="block text-[11px] font-medium text-[#333] dark:text-gray-200 truncate">
          {{ annotation.title || $t('chat-highlights') }}
        </span>
        <span class="block text-[10px] text-efv-muted">
          {{
            annotation.status === 'pending'
              ? $t('chat-highlights-pending')
              : annotation.status === 'failed'
                ? $t('chat-highlights-failed')
                : $t('chat-highlights-count', { count: annotation.highlights.length })
          }}
        </span>
      </span>
    </button>

    <!-- Recommended publications (assistant book tool) -->
    <div v-if="message.entries?.length" class="flex flex-col gap-0.5 rounded-[8px] bg-white dark:bg-white/5 p-1 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
      <SuggestionEntryItem v-for="entry in message.entries" :key="entry.id" :entry="entry" variant="row" />
    </div>
  </div>
</template>
