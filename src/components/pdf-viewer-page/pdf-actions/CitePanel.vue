<script setup lang="ts">
// Cite, the way publishers offer it: pick a style, see it, copy it or take
// the file for a reference manager. "Cite page N" adds the page you are on.
// The source is the host's BibTeX (`options.citationBib`).
import { computed, ref, shallowRef, watch } from 'vue';
import { useDocumentStore, useViewerStore } from '@/stores';
import type { CitationOutput, FormattedCitation } from '@/core/citation/formatter';
import { readPreference, writePreference } from '@/core/storage/preferences';

// The formatter (citation-js) is a separate chunk, fetched when the card first
// opens; nothing citation-related is in the reader's first download.
let formatterModule: Promise<typeof import('@/core/citation/formatter')> | null = null;
const loadFormatter = () => (formatterModule ??= import('@/core/citation/formatter'));

const viewerStore = useViewerStore();
const docStore = useDocumentStore();

type Style = {
  id: string;
  label: string;
  /** citation-js output: a CSL template for prose styles, a format for exports. */
  kind: 'csl' | 'export';
  value: string;
  ext: string;
  mime: string;
};
const STYLES: Style[] = [
  { id: 'apa', label: 'APA', kind: 'csl', value: 'apa', ext: 'txt', mime: 'text/plain' },
  { id: 'harvard', label: 'Harvard', kind: 'csl', value: 'harvard1', ext: 'txt', mime: 'text/plain' },
  { id: 'vancouver', label: 'Vancouver', kind: 'csl', value: 'vancouver', ext: 'txt', mime: 'text/plain' },
  { id: 'bibtex', label: 'BibTeX', kind: 'export', value: 'bibtex', ext: 'bib', mime: 'application/x-bibtex' },
  { id: 'biblatex', label: 'BibLaTeX', kind: 'export', value: 'biblatex', ext: 'bib', mime: 'application/x-bibtex' },
  { id: 'ris', label: 'RIS', kind: 'export', value: 'ris', ext: 'ris', mime: 'application/x-research-info-systems' },
  // Zotero, Mendeley and most reference managers import CSL-JSON directly.
  { id: 'csl-json', label: 'CSL JSON', kind: 'export', value: 'data', ext: 'json', mime: 'application/vnd.citationstyles.csl+json' },
];

const stored = readPreference('cite-style');
const styleId = ref<string>(STYLES.some((s) => s.id === stored) ? stored! : 'apa');
const style = computed(() => STYLES.find((s) => s.id === styleId.value)!);
watch(styleId, (id) => writePreference('cite-style', id));

const withPage = ref(false);
const page = computed(() => docStore.pageLabel(docStore.activePage) ?? String(docStore.activePage));

// The host's BibTeX, with `pages = {N}` set when citing the page.
const source = computed(() => {
  const bib = viewerStore.basedCitation ?? '';
  if (!withPage.value || !bib) return bib;
  if (/pages\s*=\s*\{[^}]*\}/i.test(bib)) return bib.replace(/pages\s*=\s*\{[^}]*\}/i, `pages = {${page.value}}`);
  const end = bib.lastIndexOf('}');
  return `${bib.slice(0, end).replace(/\s*,?\s*$/, '')},\n  pages = {${page.value}}\n${bib.slice(end)}`;
});

// Until the formatter has loaded, the host's BibTeX is shown as is.
const formatted = shallowRef<FormattedCitation & { error: boolean }>({
  text: viewerStore.basedCitation ?? '',
  inText: null,
  error: false,
});
const outputOf = (s: Style): CitationOutput =>
  s.kind === 'export'
    ? { kind: 'export', format: s.value as 'bibtex' | 'biblatex' | 'ris' | 'data' }
    : { kind: 'csl', template: s.value };
let formatSeq = 0;
watch(
  [source, style],
  async ([src, s]) => {
    const seq = ++formatSeq;
    try {
      const { formatCitation } = await loadFormatter();
      if (seq !== formatSeq) return;
      formatted.value = { ...formatCitation(src, outputOf(s)), error: false };
    } catch {
      if (seq === formatSeq)
        formatted.value = { text: viewerStore.basedCitation ?? '', inText: null, error: true };
    }
  },
  { immediate: true }
);

const copied = ref<'reference' | 'in-text' | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | null = null;
const copy = async (what: 'reference' | 'in-text') => {
  const text = what === 'reference' ? formatted.value.text : formatted.value.inText ?? '';
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    area.remove();
  }
  copied.value = what;
  if (copiedTimer) clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => (copied.value = null), 1600);
};

const download = () => {
  const blob = new Blob([formatted.value.text], { type: style.value.mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `citation.${style.value.ext}`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
};

// Enter copies, the most common thing to do here.
const onKey = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && !(event.target as HTMLElement).closest('button')) {
    event.preventDefault();
    copy('reference');
  }
};
</script>

<template>
  <div class="flex flex-col gap-3" @keydown="onKey">
    <!-- Style -->
    <div class="flex flex-wrap gap-1.5" role="radiogroup" :aria-label="$t('cite-style')">
      <button
        v-for="s in STYLES"
        :key="s.id"
        type="button"
        role="radio"
        :aria-checked="styleId === s.id"
        class="h-7 px-2.5 rounded-full text-[12.5px] font-medium transition-colors"
        :class="
          styleId === s.id
            ? 'bg-[#0077cc] text-white'
            : 'bg-black/[0.05] dark:bg-white/[0.08] text-[#3a3a3c] dark:text-gray-200 hover:bg-black/[0.09] dark:hover:bg-white/[0.12]'
        "
        @click="styleId = s.id"
      >
        {{ s.label }}
      </button>
    </div>

    <!-- The reference -->
    <figure
      class="relative m-0 rounded-[10px] p-3.5 pr-10 bg-[#f5f5f7] dark:bg-white/[0.06] cursor-copy"
      :title="$t('copy')"
      @click="copy('reference')"
    >
      <pre
        v-if="style.kind === 'export'"
        class="m-0 font-mono text-[11.5px] leading-[1.5] whitespace-pre-wrap break-words text-[#1d1d1f] dark:text-gray-100"
      >{{ formatted.text }}</pre>
      <p v-else class="m-0 font-serif text-[14px] leading-[1.55] text-[#1d1d1f] dark:text-gray-100">
        {{ formatted.text }}
      </p>
      <span
        class="absolute top-2.5 right-2.5 size-6 inline-flex items-center justify-center rounded-[6px]"
        :class="copied === 'reference' ? 'text-[#34c759]' : 'text-[#8e8e93]'"
        aria-hidden="true"
      >
        <svg v-if="copied === 'reference'" class="size-4" viewBox="0 0 20 20" fill="none"><path d="M4 10.5l4 4 8-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <svg v-else class="size-4" viewBox="0 0 20 20" fill="none"><rect x="6.5" y="6.5" width="10" height="10" rx="2" stroke="currentColor" stroke-width="1.5" /><path d="M13.5 6.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v7A1.5 1.5 0 0 0 5 13.5h1.5" stroke="currentColor" stroke-width="1.5" /></svg>
      </span>
    </figure>

    <!-- In-text form, for the prose styles -->
    <button
      v-if="formatted.inText"
      type="button"
      class="flex items-center gap-2 -mt-1 px-1 text-left text-[12.5px] text-[#6e6e73] dark:text-gray-400 hover:text-[#1d1d1f] dark:hover:text-white"
      @click="copy('in-text')"
    >
      <span class="shrink-0">{{ $t('cite-in-text') }}</span>
      <span class="font-serif text-[13px] text-[#1d1d1f] dark:text-gray-100 truncate">{{ formatted.inText }}</span>
      <span class="ml-auto shrink-0 text-[11.5px]" :class="copied === 'in-text' ? 'text-[#34c759]' : ''">
        {{ copied === 'in-text' ? $t('copied') : $t('copy') }}
      </span>
    </button>

    <label class="flex items-center gap-2 px-1 text-[13px] cursor-pointer select-none">
      <input v-model="withPage" type="checkbox" class="accent-[#0077cc] size-4" />
      {{ $t('cite-page', { page }) }}
    </label>

    <p v-if="formatted.error" class="px-1 text-[12px] text-[#ff3b30]">{{ $t('cite-error') }}</p>

    <div class="flex items-center gap-2 pt-1">
      <button
        type="button"
        class="flex-1 h-9 rounded-[9px] bg-[#0077cc] hover:bg-[#006bb8] text-white text-[13.5px] font-semibold transition-colors"
        @click="copy('reference')"
      >
        {{ copied === 'reference' ? $t('copied') : $t('copy-citation') }}
      </button>
      <button
        type="button"
        class="h-9 px-3 rounded-[9px] bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.09] dark:hover:bg-white/[0.12] text-[13px] font-medium"
        :title="`.${style.ext}`"
        @click="download"
      >
        {{ $t('download') }} .{{ style.ext }}
      </button>
    </div>
  </div>
</template>
