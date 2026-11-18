<script setup lang="ts">
// The Explain card. It opens beside the page (never over the passage, which
// stays marked on the page), can be dragged anywhere, and grows as answers
// arrive: the explanation (streamed), "In depth", examples, key terms,
// where else this book covers it, other publications, and questions to ask
// next. Select text inside the explanation to explain that in turn; Back
// returns. Driven by assistantStore.explainRequest, so it outlives the text
// selection that opened it.
import { computed, nextTick, onMounted, ref, useId, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAssistantStore, useDocumentStore, useViewerStore } from '@/stores';
import { BetaBadge, FloatingCard, Loader } from '@/components/pdf-aids';
import { SuggestionEntryItem } from '@/components/pdf-viewer-page/pdf-suggestions';
import { boxToViewport, pageViewport, unionBox } from '@/components/pdf-viewer-page/usePageHover';
import { renderMarkdown } from '@/assets/utils/markdown';
import { useExplanation } from '@/composables/useExplanation';
import { useAnnouncer } from '@/composables/useAnnouncer';
import { normalizeSelectedText } from '@/core/selection/textSelection';
import type { IExplainRequest } from '@/stores/assistant';
import type { ISemanticSearchResult } from '@/assets/utils/interfaces';

const props = defineProps<{ request: IExplainRequest }>();

const { t } = useI18n();
const viewerStore = useViewerStore();
const docStore = useDocumentStore();
const assistantStore = useAssistantStore();
const { announce } = useAnnouncer();
const titleId = useId();
const root = ref<HTMLElement | null>(null);
const body = ref<HTMLElement | null>(null);

const request = computed(() => props.request);
const { result, status, related, relatedStatus, elsewhere, elsewhereStatus } = useExplanation(request);
const canGoBack = computed(() => assistantStore.explainStack.length > 1);

// ---- placement ---------------------------------------------------------------
// Anchored to the explained passage, widened to the page's right edge: the
// card goes beside the page when there is room, else below or above the
// passage — never over it (FloatingCard scores overlap with the anchor). It
// follows the passage on scroll and zoom until the reader drags it away.
const pageBody = () => {
  const page = props.request.segments?.[0]?.page ?? props.request.page;
  return (
    (root.value?.closest('.efv-viewer') ?? document).querySelector<HTMLElement>(
      `[data-page-body][data-page="${page}"]`
    ) ?? null
  );
};
const cardAnchor = () => {
  const body = pageBody();
  const segment = props.request.segments?.[0];
  if (!body || !segment?.boxes.length) {
    const rect = props.request.anchor;
    return rect ? { left: rect.left, top: rect.top + 40, right: rect.right, bottom: rect.top + 80 } : null;
  }
  const passage = boxToViewport(body, unionBox(segment.boxes));
  const page = body.getBoundingClientRect();
  return passage ? { ...passage, right: Math.max(passage.right, page.right) } : null;
};
const cardBounds = () => pageViewport(pageBody()) ?? { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };

// ---- content -------------------------------------------------------------------
const pageLabel = (page: number) => docStore.pageLabel(page) ?? String(page);
const md = (text: string | null | undefined) =>
  text
    ? renderMarkdown(text, {
        page: (page) => t('page-short', { page: pageLabel(Number(page)) }),
        region: () => t('figure'),
      })
    : '';
const simpleHtml = computed(() => md(result.value?.simple));
const detailedHtml = computed(() => md(result.value?.detailed));
const loading = computed(() => status.value === 'loading');

watch(status, (value) => {
  if (value === 'done') announce(t('explain-ready'));
  if (value === 'error') announce(t('explain-failed'));
});

// ---- actions ---------------------------------------------------------------------
// Escape is handled by FloatingCard (`close`).
const close = () => assistantStore.closeExplain();

/** Back to the passage on the page. */
const showSource = () => {
  const segment = props.request.segments?.[0];
  if (segment) assistantStore.focusOn({ page: segment.page, quads: segment.boxes });
  else docStore.goTo(props.request.page, 'citation');
};

const openRelated = (passage: ISemanticSearchResult) => {
  if (passage.rects?.length) assistantStore.focusOn({ page: passage.page, quads: passage.rects });
  else docStore.goTo(passage.page, 'citation');
  viewerStore.telemetry.record('selection.action', { action: 'explain.related', page: passage.page });
};

const explainNested = (text: string) => {
  const clean = normalizeSelectedText(text);
  if (!clean || !result.value?.simple) return;
  assistantStore.openExplain(
    {
      text: clean,
      page: props.request.page,
      anchor: null,
      segments: props.request.segments,
      parent: { text: props.request.text, explanation: result.value.simple },
    },
    { push: true }
  );
  window.getSelection()?.removeAllRanges();
  nested.value = null;
};

const chatContext = () => ({
  kind: 'explain' as const,
  text: props.request.text,
  page: props.request.page,
  explanation: result.value?.simple ?? '',
  regionId: props.request.regionId,
});
const discussInChat = () => {
  if (!result.value?.simple) return;
  assistantStore.addContext(chatContext());
  close();
};
const askFollowUp = (question: string) => {
  assistantStore.askAbout(question, chatContext());
  close();
};

const copied = ref(false);
const copyExplanation = async () => {
  const text = [result.value?.simple, result.value?.detailed].filter(Boolean).join('\n\n');
  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    announce(t('copied'), 0);
    setTimeout(() => (copied.value = false), 1400);
  } catch {
    // clipboard blocked: nothing to do
  }
};

// [[page:N]] links in the explanation jump into the book.
const onBodyClick = (event: MouseEvent) => {
  const target = (event.target as HTMLElement).closest<HTMLElement>('[data-page]');
  if (target?.dataset.page) docStore.goTo(Number(target.dataset.page), 'citation');
};

// ---- explain inside the explanation ------------------------------------------------
const nested = ref<{ text: string; left: number; top: number } | null>(null);
const onBodyPointerUp = () => {
  requestAnimationFrame(() => {
    const selection = window.getSelection();
    const el = body.value;
    if (!selection || selection.isCollapsed || !el || !selection.anchorNode || !el.contains(selection.anchorNode)) {
      nested.value = null;
      return;
    }
    const text = selection.toString().trim();
    const rect = selection.getRangeAt(0).getBoundingClientRect();
    const box = el.getBoundingClientRect();
    nested.value = text
      ? { text, left: rect.left - box.left + rect.width / 2, top: rect.top - box.top + el.scrollTop }
      : null;
  });
};

onMounted(async () => {
  await nextTick();
  // Non-modal: focus moves in so keyboard and screen-reader users land on it.
  root.value?.focus({ preventScroll: true });
});
watch(
  () => props.request.id,
  () => {
    nested.value = null;
    body.value?.scrollTo({ top: 0 });
  }
);
</script>

<template>
  <FloatingCard :anchor="cardAnchor" :bounds="cardBounds" :gap="14" @close="close">
  <section
    ref="root"
    class="w-[340px] max-w-full min-h-0 max-h-[560px] flex flex-col bg-white dark:bg-[#1e1e1e] text-[#1d1d1f] dark:text-gray-100 rounded-[12px] shadow-[0_0_0_0.5px_rgba(0,0,0,0.12),0_12px_32px_rgba(0,0,0,0.22)] overflow-hidden focus:outline-none"
    role="dialog"
    :aria-labelledby="titleId"
    :aria-busy="loading"
    tabindex="-1"
  >
    <!-- Header doubles as the drag handle -->
    <div
      data-drag-handle
      class="flex items-center gap-1.5 pl-2 pr-1.5 h-10 shrink-0 select-none touch-none cursor-grab border-b border-black/[0.06] dark:border-white/10"
    >
      <button
        v-if="canGoBack"
        type="button"
        class="size-7 inline-flex items-center justify-center rounded-[7px] hover:bg-black/[0.06] dark:hover:bg-white/10"
        :aria-label="$t('explain-back')"
        :title="$t('explain-back')"
        @click="assistantStore.explainBack()"
      >
        <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="none">
          <path d="M12 4l-6 6 6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <h2 :id="titleId" class="flex-1 flex items-center gap-1.5 pl-1 text-[13px] font-semibold">
        <svg aria-hidden="true" class="size-4 text-[#0077cc] dark:text-[#64b5ff]" viewBox="0 0 20 20" fill="none">
          <path d="M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6L10 2.5z" fill="currentColor" />
        </svg>
        {{ $t('explain') }}
        <BetaBadge />
      </h2>
      <button
        type="button"
        class="size-7 inline-flex items-center justify-center rounded-[7px] text-[#8e8e93] hover:text-current hover:bg-black/[0.06] dark:hover:bg-white/10"
        :aria-label="$t('close')"
        @click="close"
      >
        <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>
    </div>

    <!-- What is explained, and the way back to it -->
    <button
      type="button"
      class="group mx-3 mt-3 shrink-0 text-left rounded-[8px] px-2.5 py-2 bg-black/[0.035] dark:bg-white/[0.06] hover:bg-black/[0.06] dark:hover:bg-white/[0.09]"
      :title="$t('explain-show-source')"
      @click="showSource"
    >
      <span class="block text-[12.5px] leading-[1.45] font-serif italic text-[#3a3a3c] dark:text-gray-300 line-clamp-3 break-words">
        „{{ request.text }}“
      </span>
      <span class="mt-1 flex items-center gap-1 text-[11px] text-[#0077cc] dark:text-[#64b5ff]">
        {{ request.parent ? $t('explain-from-explanation') : $t('page-short', { page: pageLabel(request.page) }) }}
        <span class="opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">→</span>
      </span>
    </button>

    <!-- Everything that arrives -->
    <div
      ref="body"
      class="relative flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 pt-3 pb-2"
      @click="onBodyClick"
      @pointerup="onBodyPointerUp"
    >
      <div v-if="loading" class="flex flex-col gap-2 py-1" role="status">
        <span class="sr-only">{{ $t('explain-loading') }}</span>
        <span class="h-3 rounded bg-black/[0.06] dark:bg-white/10 animate-pulse w-[92%]" />
        <span class="h-3 rounded bg-black/[0.06] dark:bg-white/10 animate-pulse w-[84%]" />
        <span class="h-3 rounded bg-black/[0.06] dark:bg-white/10 animate-pulse w-[60%]" />
      </div>
      <p v-else-if="status === 'error' && !result?.simple" class="py-4 text-center text-[12.5px] text-[#8e8e93]">
        {{ $t('explain-failed') }}
      </p>

      <template v-if="result?.simple">
        <!-- No aria-live here: streaming would re-announce every chunk; the
             viewer's announcer says "Explanation ready" once. -->
        <div class="efv-md text-[13.5px] leading-[1.55] break-words" v-html="simpleHtml" />
        <span v-if="status === 'streaming'" class="inline-block w-1.5 h-3.5 align-[-2px] bg-current opacity-50 animate-pulse" aria-hidden="true" />

        <details v-if="result.detailed" class="efv-explain-section mt-3 group/details">
          <summary class="efv-explain-heading cursor-pointer list-none flex items-center gap-1">
            <svg aria-hidden="true" class="size-3 transition-transform group-open/details:rotate-90" viewBox="0 0 20 20" fill="none">
              <path d="M7 4l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            {{ $t('explain-in-depth') }}
          </summary>
          <div class="efv-md mt-1.5 text-[13px] leading-[1.55] break-words" v-html="detailedHtml" />
        </details>

        <section v-if="result.examples?.length" class="efv-explain-section mt-3">
          <h3 class="efv-explain-heading">{{ $t('examples') }}</h3>
          <ul class="m-0 p-0 list-none flex flex-col gap-2">
            <li v-for="(example, index) in result.examples" :key="index" class="text-[13px] leading-[1.5]">
              <span class="font-semibold">{{ example.label }}</span>
              <span class="text-[#3a3a3c] dark:text-gray-300"> — {{ example.description }}</span>
            </li>
          </ul>
        </section>

        <section v-if="result.terms?.length" class="efv-explain-section mt-3">
          <h3 class="efv-explain-heading">{{ $t('explain-terms') }}</h3>
          <ul class="m-0 p-0 list-none flex flex-col gap-1.5">
            <li v-for="term in result.terms" :key="term.term" class="text-[13px] leading-[1.45]">
              <button
                type="button"
                class="font-semibold text-[#0077cc] dark:text-[#64b5ff] hover:underline"
                :title="$t('explain-term', { term: term.term })"
                @click="explainNested(term.term)"
              >
                {{ term.term }}
              </button>
              <span class="text-[#3a3a3c] dark:text-gray-300"> — {{ term.definition }}</span>
            </li>
          </ul>
        </section>
      </template>

      <!-- Elsewhere in this book -->
      <section v-if="related.length || relatedStatus === 'loading'" class="efv-explain-section mt-3">
        <h3 class="efv-explain-heading">{{ $t('explain-related') }}</h3>
        <p v-if="relatedStatus === 'loading' && !related.length" class="text-[12px] text-[#8e8e93]">{{ $t('explain-looking') }}</p>
        <ul class="m-0 p-0 list-none flex flex-col">
          <li v-for="(passage, index) in related" :key="passage.id ?? index">
            <button
              type="button"
              class="w-full text-left flex gap-2 px-1.5 py-1.5 -mx-1.5 rounded-[7px] hover:bg-black/[0.04] dark:hover:bg-white/[0.06]"
              @click="openRelated(passage)"
            >
              <span class="shrink-0 min-w-[38px] text-[11.5px] font-medium tabular-nums text-[#0077cc] dark:text-[#64b5ff] pt-px">
                {{ $t('page-short', { page: pageLabel(passage.page) }) }}
              </span>
              <span class="min-w-0 flex flex-col">
                <span v-if="passage.title" class="text-[12.5px] font-medium truncate">{{ passage.title }}</span>
                <span class="text-[12px] leading-[1.4] text-[#6e6e73] dark:text-gray-400 line-clamp-2">{{ passage.text }}</span>
              </span>
            </button>
          </li>
        </ul>
      </section>

      <!-- Other publications -->
      <section v-if="elsewhere.length || elsewhereStatus === 'loading'" class="efv-explain-section mt-3">
        <h3 class="efv-explain-heading">{{ $t('explain-elsewhere') }}</h3>
        <div v-if="elsewhereStatus === 'loading' && !elsewhere.length" class="flex justify-center py-2">
          <Loader :size="18" color="#0077cc" :label="$t('explain-elsewhere')" />
        </div>
        <div class="flex flex-col gap-[2px] -mx-1">
          <SuggestionEntryItem v-for="entry in elsewhere" :key="entry.id" :entry="entry" variant="row" />
        </div>
      </section>

      <!-- Questions to ask next -->
      <section v-if="viewerStore.chatPackage && result?.followUps?.length" class="efv-explain-section mt-3">
        <h3 class="efv-explain-heading">{{ $t('explain-follow-ups') }}</h3>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="question in result.followUps"
            :key="question"
            type="button"
            class="text-left px-2.5 py-1 rounded-full text-[12px] bg-[#0077cc]/[0.08] text-[#005fa3] dark:bg-[#64b5ff]/15 dark:text-[#9ccfff] hover:bg-[#0077cc]/[0.14]"
            @click="askFollowUp(question)"
          >
            {{ question }}
          </button>
        </div>
      </section>

      <!-- Explain a part of the explanation -->
      <button
        v-if="nested"
        type="button"
        class="efv-selection-menu absolute z-10 -translate-x-1/2 -translate-y-[calc(100%+6px)] inline-flex items-center gap-1 h-7 px-2.5 rounded-[8px] text-[12.5px] font-semibold text-[#0077cc] dark:text-[#64b5ff]"
        :style="{ left: `${nested.left}px`, top: `${nested.top}px` }"
        @pointerdown.prevent
        @click="explainNested(nested.text)"
      >
        {{ $t('explain') }}
      </button>
    </div>

    <!-- Hand-offs -->
    <div
      v-if="result?.simple"
      class="shrink-0 flex items-center gap-1.5 px-3 py-2 border-t border-black/[0.06] dark:border-white/10"
    >
      <button
        v-if="viewerStore.chatPackage"
        type="button"
        class="flex-1 h-8 inline-flex items-center justify-center gap-1.5 rounded-[8px] text-[12.5px] font-semibold bg-[#0077cc] hover:bg-[#006bb8] text-white"
        @click="discussInChat"
      >
        <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
          <path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
        </svg>
        {{ $t('discuss-in-chat') }}
      </button>
      <button
        type="button"
        class="h-8 px-3 inline-flex items-center justify-center rounded-[8px] text-[12.5px] font-medium bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.09] dark:hover:bg-white/[0.12]"
        :class="viewerStore.chatPackage ? '' : 'flex-1'"
        @click="copyExplanation"
      >
        {{ copied ? $t('copied') : $t('copy') }}
      </button>
    </div>
  </section>
  </FloatingCard>
</template>
