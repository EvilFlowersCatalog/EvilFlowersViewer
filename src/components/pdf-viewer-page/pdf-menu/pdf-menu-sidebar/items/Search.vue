<script setup lang="ts">
// Search, kept simple: one field, one list.
//  · Matches of the words, grouped by chapter (or page), highlighted on the page.
//  · "Related passages" from the host's AI search, a short section on top
//    when the host has one: no mode, no toggle.
//  · Results the host pushed in (e.g. the sources of a chat answer), on top.
// State lives in the search store, shared with the find pill, the page
// highlights and the host's controller.
import { computed, ref, watch } from 'vue';
import { debounce } from '@/assets/utils/functions';
import { useDocumentStore, useSearchStore, useViewerStore } from '@/stores';
import type { ISearchHit, ITOCItem, SEARCH_SOURCE } from '@/assets/utils/interfaces';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const search = useSearchStore();

const input = ref<HTMLInputElement | null>(null);
const text = ref(search.query);
const hasRelated = computed(() => !!viewerStore.semanticSearchFunction);
const showOptions = ref(false);
const relatedExpanded = ref(false);

const runText = debounce((q: string) => search.run(q), 200);
// The AI search costs the host a request: wait until typing pauses.
const runRelated = debounce((q: string) => search.runSemantic(q), 700);

const searchNow = (q: string) => {
  relatedExpanded.value = false;
  if (!q.trim()) {
    search.clear();
    return;
  }
  runText(q);
  if (hasRelated.value && q.trim().length >= 3) runRelated(q);
};

const onInput = (event: Event) => {
  text.value = (event.target as HTMLInputElement).value;
  searchNow(text.value);
};

// Searches started elsewhere (the host, the find pill) show up in the field.
watch(
  () => search.query,
  (q) => {
    if (q !== text.value) text.value = q;
  }
);

const onKeydown = (event: KeyboardEvent) => {
  event.stopPropagation(); // the viewer's one-key shortcuts stay out of the field
  if (event.key === 'Enter') {
    event.preventDefault();
    search.step(event.shiftKey ? -1 : 1);
  } else if (event.key === 'Escape' && text.value) {
    event.preventDefault();
    text.value = '';
    search.clear();
  }
};

const clearField = () => {
  text.value = '';
  search.clear();
  input.value?.focus();
};

type OptionKey = 'caseSensitive' | 'wholeWord' | 'ignoreDiacritics';
const OPTIONS: { key: OptionKey; label: string }[] = [
  { key: 'caseSensitive', label: 'search-opt-case' },
  { key: 'wholeWord', label: 'search-opt-word' },
  { key: 'ignoreDiacritics', label: 'search-opt-diacritics' },
];
const toggle = (key: OptionKey) => {
  search.options = { ...search.options, [key]: !search.options[key] };
  if (text.value.trim()) search.run(text.value);
};
const optionsChanged = computed(
  () =>
    search.options.caseSensitive ||
    search.options.wholeWord ||
    !search.options.ignoreDiacritics
);

// ---- chapters: the outline's top two levels, by start page ----
const chapters = computed(() => {
  const flat: { title: string; page: number }[] = [];
  const walk = (items: ITOCItem[], depth: number) => {
    for (const item of items) {
      if (item.pageNumber > 0) flat.push({ title: item.title, page: item.pageNumber });
      if (depth < 1) walk(item.children, depth + 1);
    }
  };
  walk(docStore.toc, 0);
  return flat.sort((a, b) => a.page - b.page);
});

const chapterOf = (page: number) => {
  let found: { title: string; page: number } | null = null;
  for (const chapter of chapters.value) {
    if (chapter.page > page) break;
    found = chapter;
  }
  return found;
};

// Word matches in reading order, one group per chapter (or per page).
const groups = computed(() => {
  const out: { key: string; title: string; hits: { hit: ISearchHit; index: number }[] }[] = [];
  search.results.text.forEach((hit, index) => {
    const chapter = chapters.value.length ? chapterOf(hit.page) : null;
    const key = chapter ? `c${chapter.page}:${chapter.title}` : `p${hit.page}`;
    const last = out[out.length - 1];
    if (last?.key === key) last.hits.push({ hit, index });
    else
      out.push({
        key,
        title: chapter?.title ?? `${' '}`,
        hits: [{ hit, index }],
      });
  });
  return out;
});

const related = computed(() => search.results.semantic);
const relatedShown = computed(() =>
  relatedExpanded.value ? related.value : related.value.slice(0, 3)
);
const hostResults = computed(() => search.results.host);

const isActive = (kind: SEARCH_SOURCE, index: number) =>
  search.source === kind && search.active === index;

const pageText = (page: number) => {
  const label = docStore.pageLabel(page);
  return label ?? String(page);
};

const listRef = ref<HTMLElement | null>(null);
// Keep the selected result in view when stepping with Enter / ‹ ›.
watch(
  () => search.selectSeq,
  () =>
    requestAnimationFrame(() =>
      listRef.value
        ?.querySelector('[aria-selected="true"]')
        ?.scrollIntoView({ block: 'nearest' })
    )
);

const matchCount = computed(() => search.results.text.length);
</script>

<template>
  <div class="flex flex-col h-full min-h-0 -mx-2 -my-2">
    <!-- The field -->
    <div class="px-3 pt-3 pb-2 shrink-0">
      <div
        class="relative flex items-center gap-2 h-9 pl-2.5 pr-1 rounded-[9px] bg-black/[0.045] dark:bg-white/[0.07] focus-within:bg-white dark:focus-within:bg-[#2a2a2a] focus-within:ring-2 focus-within:ring-[#0077cc]/70 transition-colors"
      >
        <svg aria-hidden="true" class="size-4 shrink-0 text-[#8a8a8a]" viewBox="0 0 20 20" fill="none">
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" stroke-width="1.7" />
          <path d="M13 13l4 4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
        </svg>
        <input
          ref="input"
          name="search-pattern"
          type="search"
          autocomplete="off"
          spellcheck="false"
          class="flex-1 min-w-0 bg-transparent text-[14px] text-[#1d1d1f] dark:text-gray-100 placeholder:text-[#8e8e93] outline-none [&::-webkit-search-cancel-button]:hidden"
          :value="text"
          :placeholder="$t('search-placeholder')"
          :aria-label="$t('search')"
          aria-controls="efv-search-results"
          @input="onInput"
          @keydown="onKeydown"
        />
        <button
          v-if="text"
          type="button"
          class="size-[18px] flex items-center justify-center rounded-full bg-[#8e8e93]/60 text-white hover:bg-[#8e8e93]"
          :aria-label="$t('search-clear')"
          @click="clearField"
        >
          <svg aria-hidden="true" width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" /></svg>
        </button>
        <button
          type="button"
          class="size-7 flex items-center justify-center rounded-[7px] transition-colors"
          :class="optionsChanged ? 'text-[#0077cc]' : 'text-[#8a8a8a] hover:text-[#333] dark:hover:text-gray-200'"
          :aria-label="$t('search-options')"
          :aria-expanded="showOptions"
          @click="showOptions = !showOptions"
        >
          <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="currentColor"><circle cx="4.5" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="15.5" cy="10" r="1.6" /></svg>
        </button>
      </div>

      <!-- Options, out of the way until asked for -->
      <div v-if="showOptions" class="mt-2 flex flex-col gap-0.5 px-1">
        <label
          v-for="opt in OPTIONS"
          :key="opt.key"
          class="flex items-center gap-2 py-1 text-[12.5px] text-[#333] dark:text-gray-200 cursor-pointer"
        >
          <input
            type="checkbox"
            class="accent-[#0077cc] size-3.5"
            :checked="search.options[opt.key]"
            @change="toggle(opt.key)"
          />
          {{ $t(opt.label) }}
        </label>
      </div>

      <!-- One quiet line: what was found, and where we are in it -->
      <div
        v-if="search.query"
        class="mt-2 flex items-center gap-2 min-h-[24px] text-[12px] text-[#6e6e73] dark:text-gray-400"
      >
        <span class="flex-1 min-w-0 truncate" aria-live="polite">
          <template v-if="search.status === 'searching'">
            {{ $t('search-progress', { done: search.progress.done, total: search.progress.total }) }}
          </template>
          <template v-else-if="matchCount">
            {{ $t('search-summary', { n: matchCount, pages: new Set(search.results.text.map((h) => h.page)).size }) }}
          </template>
          <template v-else>{{ $t('not-found') }}</template>
        </span>
        <template v-if="search.hits.length">
          <span class="tabular-nums">{{ search.active !== null ? search.active + 1 : '–' }}/{{ search.hits.length }}</span>
          <button
            type="button"
            class="size-6 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            :aria-label="$t('previous-result')"
            :title="`${$t('previous-result')} (⇧↩)`"
            @click="search.step(-1)"
          >
            <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none"><path d="M5 12l5-5 5 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
          <button
            type="button"
            class="size-6 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10"
            :aria-label="$t('next-result')"
            :title="`${$t('next-result')} (↩)`"
            @click="search.step(1)"
          >
            <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none"><path d="M5 8l5 5 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>
          </button>
        </template>
      </div>
      <div
        v-if="search.status === 'searching'"
        class="mt-1 h-[2px] rounded-full bg-black/5 dark:bg-white/10 overflow-hidden"
      >
        <div
          class="h-full bg-[#0077cc] transition-[width] duration-150"
          :style="{ width: `${search.progress.total ? (search.progress.done / search.progress.total) * 100 : 0}%` }"
        />
      </div>
    </div>

    <!-- One list -->
    <div
      id="efv-search-results"
      ref="listRef"
      class="flex-1 min-h-0 overflow-auto px-2 pb-4"
      role="listbox"
      :aria-label="$t('results')"
    >
      <p v-if="!search.query && !hostResults.length" class="px-2 pt-2 text-[12px] leading-relaxed text-[#8e8e93]">
        {{ $t(hasRelated ? 'search-empty-ai' : 'search-empty') }}
      </p>

      <!-- The host's own results, e.g. the sources of a chat answer -->
      <section v-if="hostResults.length" class="mb-3">
        <h3 class="px-2 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6e6e73] dark:text-gray-400">
          {{ search.hostLabel || $t('search-tab-host') }}
        </h3>
        <button
          v-for="(hit, index) in hostResults"
          :key="hit.id"
          type="button"
          role="option"
          class="efv-result"
          :aria-selected="isActive('host', index)"
          @click="search.select(index, 'host')"
        >
          <span v-if="hit.title" class="block text-[12px] font-semibold text-[#1d1d1f] dark:text-white truncate">{{ hit.title }}</span>
          <span class="block line-clamp-3">{{ hit.before }}{{ hit.match }}{{ hit.after }}</span>
          <span class="efv-result-page">{{ $t('page-short', { page: pageText(hit.page) }) }}</span>
        </button>
      </section>

      <!-- Related passages (the host's AI search), a few at a time -->
      <section
        v-if="search.query && hasRelated && (related.length || search.semanticStatus === 'searching')"
        class="mb-3"
      >
        <h3 class="flex items-center gap-1.5 px-2 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#6e6e73] dark:text-gray-400">
          <svg aria-hidden="true" class="size-3 text-[#0077cc]" viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l1.9 5.1 5.1 1.9-5.1 1.9L10 15.5l-1.9-5.1L3 8.5l5.1-1.9L10 1.5zM16 13l.9 2.1L19 16l-2.1.9L16 19l-.9-2.1L13 16l2.1-.9L16 13z" /></svg>
          {{ $t('search-related') }}
          <span v-if="search.semanticStatus === 'searching'" class="ml-1 normal-case font-normal tracking-normal">…</span>
        </h3>
        <button
          v-for="(hit, index) in relatedShown"
          :key="hit.id"
          type="button"
          role="option"
          class="efv-result"
          :aria-selected="isActive('semantic', index)"
          @click="search.select(index, 'semantic')"
        >
          <span v-if="hit.title" class="block text-[12px] font-semibold text-[#1d1d1f] dark:text-white truncate">{{ hit.title }}</span>
          <span class="block line-clamp-3">{{ hit.before }}<mark v-if="hit.match" class="efv-mark">{{ hit.match }}</mark>{{ hit.after }}</span>
          <span v-if="hit.reason" class="block mt-0.5 text-[11.5px] text-[#6e6e73] dark:text-gray-400 line-clamp-2">{{ hit.reason }}</span>
          <span class="efv-result-page">{{ $t('page-short', { page: pageText(hit.page) }) }}</span>
        </button>
        <button
          v-if="related.length > 3"
          type="button"
          class="ml-2 mt-0.5 text-[12px] font-medium text-[#0077cc] hover:underline"
          @click="relatedExpanded = !relatedExpanded"
        >
          {{ relatedExpanded ? $t('search-show-less') : $t('search-show-more', { n: related.length - 3 }) }}
        </button>
      </section>

      <!-- Matches of the words, by chapter -->
      <section v-for="group in groups" :key="group.key" class="mb-2">
        <h3
          v-if="chapters.length"
          class="sticky top-0 z-[1] px-2 py-1.5 text-[11px] font-semibold text-[#6e6e73] dark:text-gray-400 bg-white/95 dark:bg-[#1e1e1e]/95 backdrop-blur-sm truncate"
          :title="group.title"
        >
          {{ group.title }}
        </h3>
        <button
          v-for="{ hit, index } in group.hits"
          :key="hit.id"
          type="button"
          role="option"
          class="efv-result"
          :aria-selected="isActive('text', index)"
          @click="search.select(index, 'text')"
        >
          <span class="block line-clamp-2">{{ hit.before }}<mark class="efv-mark">{{ hit.match }}</mark>{{ hit.after }}</span>
          <span class="efv-result-page">{{ $t('page-short', { page: pageText(hit.page) }) }}</span>
        </button>
      </section>

      <p v-if="search.truncated" class="px-2 py-2 text-[11.5px] text-[#8e8e93]">
        {{ $t('search-truncated', { n: matchCount }) }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.efv-result {
  display: block;
  width: 100%;
  text-align: left;
  padding: 7px 10px 6px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.45;
  color: #3a3a3c;
  overflow-wrap: anywhere;
  transition: background-color 120ms;
}
.efv-result:hover {
  background: rgba(0, 0, 0, 0.04);
}
.efv-result[aria-selected='true'] {
  background: rgba(0, 119, 204, 0.12);
  color: #1d1d1f;
}
.dark .efv-result {
  color: #d1d1d6;
}
.dark .efv-result:hover {
  background: rgba(255, 255, 255, 0.06);
}
.dark .efv-result[aria-selected='true'] {
  background: rgba(0, 119, 204, 0.3);
  color: #fff;
}
.efv-result-page {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #8e8e93;
  font-variant-numeric: tabular-nums;
}
.efv-mark {
  background: rgba(255, 214, 10, 0.55);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}
</style>
