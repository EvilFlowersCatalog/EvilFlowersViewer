<script setup lang="ts">
// Sidebar list of agent annotations: show/hide all or one, ask for a new one,
// and step through each annotation's highlights in reading order.
import { nextTick, ref, watch } from 'vue';
import { useAssistantStore, useViewerStore } from '@/stores';
import { Loader } from '@/components/pdf-aids';
import { highlightColor } from '@/components/pdf-viewer-page/pdf-agent/colors';
import type { IAgentAnnotation } from '@/assets/utils/interfaces';

const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();

const prompt = ref('');
const listRef = ref<HTMLDivElement | null>(null);
const collapsed = ref<Set<string>>(new Set());

const request = () => {
  if (!prompt.value.trim()) return;
  assistantStore.requestAgentAnnotation(prompt.value);
  prompt.value = '';
};

const ordered = (annotation: IAgentAnnotation) => [...annotation.highlights].sort((a, b) => a.seq - b.seq);

const toggleCollapsed = (id: string) => {
  if (collapsed.value.has(id)) collapsed.value.delete(id);
  else collapsed.value.add(id);
};

// Keep the active row in view when navigating from the page.
watch(
  () => assistantStore.activeHighlightId,
  (id) =>
    nextTick(() => {
      if (id) listRef.value?.querySelector(`[data-highlight="${id}"]`)?.scrollIntoView({ block: 'nearest' });
    }),
  { immediate: true }
);
</script>

<template>
  <div ref="listRef" class="flex flex-col gap-2.5 px-1 py-1">
    <!-- Global toggle (switch) -->
    <button
      type="button"
      role="switch"
      :aria-checked="assistantStore.showAgentHighlights"
      class="flex items-center justify-between gap-2 px-2 py-1.5 rounded-[6px] bg-field hover:bg-accent-soft dark:bg-white/5 dark:hover:bg-white/10 transition-colors select-none"
      @click="assistantStore.showAgentHighlights = !assistantStore.showAgentHighlights"
    >
      <span class="flex items-center gap-1.5 text-[11px] font-medium text-[#333] dark:text-gray-200">
        <svg aria-hidden="true" class="size-3.5 text-efv-muted" viewBox="0 0 20 20" fill="none">
          <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" stroke="currentColor" stroke-width="1.4" />
          <circle cx="10" cy="10" r="2.2" stroke="currentColor" stroke-width="1.4" />
          <path v-if="!assistantStore.showAgentHighlights" d="M3 3l14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
        </svg>
        {{ $t('agent-show') }}
      </span>
      <span
        aria-hidden="true"
        class="relative shrink-0 w-7 h-4 rounded-full transition-colors"
        :class="assistantStore.showAgentHighlights ? 'bg-secondary' : 'bg-gray-300 dark:bg-white/20'"
      >
        <span
          class="absolute top-0.5 left-0.5 size-3 rounded-full bg-white shadow transition-transform"
          :class="assistantStore.showAgentHighlights ? 'translate-x-3' : 'translate-x-0'"
        />
      </span>
    </button>

    <!-- New request: same composer look as the chat input -->
    <form
      v-if="viewerStore.agentAnnotationPackage?.requestAnnotationFunc"
      class="flex flex-col gap-1.5 pt-1"
      @submit.prevent="request"
    >
      <span class="px-0.5 text-[10px] font-semibold uppercase tracking-[0.4px] text-efv-muted">
        {{ $t('agent-new') }}
      </span>
      <div
        class="flex flex-col rounded-[8px] border border-efv-border bg-white dark:bg-[#262626] transition-colors focus-within:border-secondary"
      >
        <textarea
          v-model="prompt"
          rows="2"
          class="efv-bare-input w-full resize-none bg-transparent outline-none px-2.5 pt-2 text-[11px] leading-[15px] text-efv-text placeholder:text-efv-muted"
          :placeholder="$t('agent-request-placeholder')"
          @keydown.stop
          @keydown.enter.exact.prevent="request"
        />
        <div class="flex items-center justify-end px-1.5 pb-1.5">
          <button
            type="submit"
            class="h-6 px-3 rounded-[5px] text-[11px] font-medium transition-colors"
            :class="
              prompt.trim()
                ? 'bg-secondary text-white hover:bg-secondary-strong'
                : 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500 cursor-default'
            "
            :disabled="!prompt.trim()"
          >
            {{ $t('agent-request') }}
          </button>
        </div>
      </div>
    </form>

    <!-- Divider before the list -->
    <div class="flex items-center gap-2 pt-2">
      <span class="text-[10px] font-semibold uppercase tracking-[0.4px] text-efv-muted">{{ $t('agent-annotations') }}</span>
      <span class="flex-1 h-px bg-efv-border" aria-hidden="true" />
    </div>

    <p v-if="!assistantStore.agentAnnotations.length" class="text-[10px] text-efv-muted px-1">
      {{ $t('agent-empty') }}
    </p>

    <!-- Annotations -->
    <section
      v-for="annotation in assistantStore.agentAnnotations"
      :key="annotation.id"
      class="flex flex-col rounded-[8px] border border-efv-border bg-white dark:bg-[#262626] overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
      :class="{ 'opacity-50': !assistantStore.isAnnotationVisible(annotation.id) && annotation.status === 'done' }"
    >
      <header class="flex items-start gap-1.5 px-2.5 py-2 border-b border-efv-border">
        <span
          class="mt-1 size-2 rounded-full shrink-0"
          :style="{ backgroundColor: highlightColor(assistantStore.annotationColorIndex(annotation.id), 1) }"
          aria-hidden="true"
        />
        <button
          type="button"
          class="flex-1 min-w-0 text-left text-[11px] font-semibold leading-[14px] text-[#333] dark:text-gray-200 break-words"
          :aria-expanded="!collapsed.has(annotation.id)"
          @click="toggleCollapsed(annotation.id)"
        >
          {{ annotation.title }}
        </button>
        <template v-if="annotation.status === 'done'">
          <button
            type="button"
            class="p-0.5 rounded text-efv-muted hover:text-efv-text"
            :aria-label="$t(assistantStore.hiddenAnnotationIds.has(annotation.id) ? 'agent-show-one' : 'agent-hide-one')"
            :title="$t(assistantStore.hiddenAnnotationIds.has(annotation.id) ? 'agent-show-one' : 'agent-hide-one')"
            @click="assistantStore.toggleAnnotation(annotation.id)"
          >
            <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
              <path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10Z" stroke="currentColor" stroke-width="1.4" />
              <circle cx="10" cy="10" r="2.2" stroke="currentColor" stroke-width="1.4" />
              <path v-if="assistantStore.hiddenAnnotationIds.has(annotation.id)" d="M3 3l14 14" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" />
            </svg>
          </button>
          <button
            v-if="viewerStore.agentAnnotationPackage?.deleteAnnotationFunc"
            type="button"
            class="p-0.5 rounded text-efv-muted hover:text-red"
            :aria-label="$t('delete')"
            :title="$t('delete')"
            @click="assistantStore.deleteAnnotation(annotation.id)"
          >
            <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
              <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </template>
      </header>

      <div v-if="annotation.status === 'pending'" class="flex items-center gap-2 px-2 py-2">
        <span class="size-4 inline-flex shrink-0"><Loader :size="14" color="#0077cc" :label="$t('agent-pending')" /></span>
        <span class="text-[10px] text-efv-muted">{{ $t('agent-pending') }}</span>
      </div>
      <p v-else-if="annotation.status === 'failed'" class="px-2 py-2 text-[10px] text-red">{{ $t('agent-failed') }}</p>

      <template v-else-if="!collapsed.has(annotation.id)">
        <p v-if="annotation.summary" class="px-2.5 pt-2 text-[10px] leading-[14px] text-efv-muted">{{ annotation.summary }}</p>

        <!-- Step through -->
        <div v-if="annotation.highlights.length" class="flex items-center gap-1 px-2.5 pt-2 pb-0.5">
          <button
            type="button"
            class="px-1.5 py-0.5 rounded text-[10px] bg-accent-soft text-accent-ink"
            :aria-label="$t('previous-result')"
            @click="assistantStore.stepHighlight(annotation.id, -1)"
          >
            ‹
          </button>
          <button
            type="button"
            class="px-1.5 py-0.5 rounded text-[10px] bg-accent-soft text-accent-ink"
            :aria-label="$t('next-result')"
            @click="assistantStore.stepHighlight(annotation.id, 1)"
          >
            ›
          </button>
          <span class="ml-auto text-[10px] text-efv-muted">
            {{ $t('agent-count', { n: annotation.highlights.length }) }}
          </span>
        </div>

        <ol class="list-none m-0 p-1 flex flex-col gap-0.5">
          <li v-for="highlight in ordered(annotation)" :key="highlight.id">
            <button
              type="button"
              :data-highlight="highlight.id"
              class="w-full flex gap-1.5 text-left px-1.5 py-1 rounded-[4px] transition-colors"
              :class="
                assistantStore.activeHighlightId === highlight.id
                  ? 'bg-accent-soft dark:bg-white/10'
                  : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
              "
              @click="assistantStore.goToHighlight(annotation.id, highlight)"
            >
              <span class="shrink-0 text-[10px] font-semibold text-accent-ink w-4">{{ highlight.seq }}</span>
              <span class="flex-1 min-w-0 text-[10px] leading-[13px] text-[#333] dark:text-gray-300 line-clamp-2">{{ highlight.text }}</span>
              <span class="shrink-0 text-[9px] text-efv-muted">{{ highlight.page }}</span>
            </button>
          </li>
        </ol>
        <p v-if="annotation.unresolvedCount" class="px-2 pb-1.5 text-[9px] text-efv-muted italic">
          {{ $t('agent-unresolved', { n: annotation.unresolvedCount }) }}
        </p>
      </template>
    </section>
  </div>
</template>
