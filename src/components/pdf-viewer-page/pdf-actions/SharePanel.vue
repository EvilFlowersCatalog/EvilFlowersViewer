<script setup lang="ts">
// Share, two different things side by side (#155):
//  · a link to this page (`options.linkFunction`), for people who can already
//    read the publication: it grants nothing;
//  · sharing access (`options.shareFunction`): what (the whole document, this
//    page, or pages), for how long, with or without your annotations; then the
//    link, ready to copy, as a QR code, or to the system share sheet.
// Everything happens here, nothing opens elsewhere.
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { DAY, ERROR_LINK } from '@/assets/utils/constans';
import { useDocumentStore, useViewerStore } from '@/stores';
import { isPageRange, pagesForScope, type PageScope } from '@/core/document/pageRange';
import { copyText } from '@/core/clipboard';
import { useAnnouncer } from '@/composables/useAnnouncer';
import { useI18n } from 'vue-i18n';

// The QR encoder is fetched only once a link exists to encode.
const QrcodeVue = defineAsyncComponent(() => import('qrcode.vue'));

const viewerStore = useViewerStore();
const docStore = useDocumentStore();
const { announce } = useAnnouncer();
const { t } = useI18n();

const canShareAccess = computed(() => !!(viewerStore.shareFunction && viewerStore.config.share));

// ---- link to this page (no access granted) ----------------------------------
const pageLink = ref<'idle' | 'working' | 'copied' | 'error'>('idle');
const copyPageLink = async () => {
  if (!viewerStore.linkFunction || pageLink.value === 'working') return;
  pageLink.value = 'working';
  viewerStore.events.emit('action', { action: 'copy-link' });
  let url: string | null = null;
  try {
    url = (await viewerStore.linkFunction({ page: docStore.activePage })) || null;
  } catch {
    url = null;
  }
  const ok = !!url && (await copyText(url));
  pageLink.value = ok ? 'copied' : 'error';
  announce(t(ok ? 'link-copied' : 'link-failed-short'), 0);
  setTimeout(() => (pageLink.value = 'idle'), ok ? 1600 : 2400);
};

const scope = ref<PageScope>('document');
const customPages = ref('');
const lifespan = ref<number>(DAY * 7);
const withAnnotations = ref(false);
const LIFESPANS = [
  { hours: DAY, label: 'share-1-day' },
  { hours: DAY * 7, label: 'share-7-days' },
  { hours: DAY * 30, label: 'share-30-days' },
];

const rangeValid = computed(() => scope.value !== 'pages' || isPageRange(customPages.value));
const pages = computed(() => pagesForScope(scope.value, docStore.activePage, customPages.value));

const status = ref<'idle' | 'working' | 'ready' | 'error'>('idle');
const link = ref('');

// Changing what is shared invalidates the link made before.
watch([scope, customPages, lifespan, withAnnotations], () => {
  if (status.value !== 'working') status.value = 'idle';
});

const create = async () => {
  if (!viewerStore.shareFunction || !rangeValid.value) return;
  status.value = 'working';
  const expires = new Date();
  expires.setHours(expires.getHours() + lifespan.value);
  try {
    const result = await viewerStore.shareFunction(pages.value, expires.toISOString());
    if (!result || result === ERROR_LINK) throw new Error('no link');
    const url = new URL(result);
    url.searchParams.set('annotations', String(withAnnotations.value));
    link.value = url.toString();
    status.value = 'ready';
    copy();
  } catch {
    status.value = 'error';
  }
};

const copied = ref(false);
const copy = async () => {
  try {
    await navigator.clipboard.writeText(link.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch {
    // the field is selectable as a fallback
  }
};

const canNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;
const nativeShare = () =>
  navigator.share?.({ url: link.value, title: viewerStore.title ?? undefined }).catch(() => undefined);
</script>

<template>
  <div class="flex flex-col gap-3.5">
    <!-- A plain link: grants nothing -->
    <section v-if="viewerStore.linkFunction" class="flex flex-col gap-1.5">
      <h3 class="efv-label">{{ $t('link-section') }}</h3>
      <button
        type="button"
        class="h-9 px-3 flex items-center justify-between gap-2 rounded-[9px] text-[13px] font-medium bg-black/[0.05] dark:bg-white/[0.07] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] transition-colors disabled:opacity-60"
        :disabled="pageLink === 'working'"
        @click="copyPageLink"
      >
        <span>{{ $t('link-to-page', { page: docStore.pageLabel(docStore.activePage) ?? docStore.activePage }) }}</span>
        <span
          class="text-[12px]"
          :class="pageLink === 'error' ? 'text-[#ff3b30]' : pageLink === 'copied' ? 'text-[#34c759]' : 'text-[#0077cc]'"
          aria-live="polite"
        >
          {{ pageLink === 'copied' ? $t('link-copied') : pageLink === 'error' ? $t('link-failed-short') : $t('copy') }}
        </span>
      </button>
    </section>

    <template v-if="canShareAccess">
    <h3 v-if="viewerStore.linkFunction" class="efv-label -mb-2">{{ $t('share-access-section') }}</h3>
    <!-- What -->
    <fieldset class="flex flex-col gap-1.5">
      <legend class="efv-label">{{ $t('share-what') }}</legend>
      <div class="grid grid-cols-3 gap-0.5 p-0.5 rounded-[9px] bg-black/[0.05] dark:bg-white/[0.07]">
        <button
          v-for="option in (['document', 'page', 'pages'] as const)"
          :key="option"
          type="button"
          class="h-7 rounded-[7px] text-[12.5px] font-medium transition"
          :class="scope === option ? 'bg-white dark:bg-[#3a3a3c] shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-[#6e6e73] dark:text-gray-400'"
          :aria-pressed="scope === option"
          @click="scope = option"
        >
          {{ option === 'page' ? $t('share-this-page', { page: docStore.pageLabel(docStore.activePage) ?? docStore.activePage }) : $t(`share-${option}`) }}
        </button>
      </div>
      <input
        v-if="scope === 'pages'"
        v-model="customPages"
        type="text"
        inputmode="numeric"
        class="h-9 px-3 rounded-[9px] text-[13px] bg-black/[0.04] dark:bg-white/[0.06] outline-none focus:ring-2 focus:ring-[#0077cc]/70"
        :class="customPages && !rangeValid ? 'ring-2 ring-[#ff3b30]/70' : ''"
        placeholder="1, 4–7, 10"
        :aria-label="$t('pages')"
      />
    </fieldset>

    <!-- For how long -->
    <fieldset class="flex flex-col gap-1.5">
      <legend class="efv-label">{{ $t('share-expires') }}</legend>
      <div class="grid grid-cols-3 gap-0.5 p-0.5 rounded-[9px] bg-black/[0.05] dark:bg-white/[0.07]">
        <button
          v-for="option in LIFESPANS"
          :key="option.hours"
          type="button"
          class="h-7 rounded-[7px] text-[12.5px] font-medium transition"
          :class="lifespan === option.hours ? 'bg-white dark:bg-[#3a3a3c] shadow-[0_1px_3px_rgba(0,0,0,0.12)]' : 'text-[#6e6e73] dark:text-gray-400'"
          :aria-pressed="lifespan === option.hours"
          @click="lifespan = option.hours"
        >
          {{ $t(option.label) }}
        </button>
      </div>
    </fieldset>

    <label v-if="viewerStore.editPackage" class="flex items-center gap-2 text-[13px] cursor-pointer select-none">
      <input v-model="withAnnotations" type="checkbox" class="accent-[#0077cc] size-4" />
      {{ $t('share-with-annotations') }}
    </label>

    <!-- The link -->
    <div v-if="status === 'ready'" class="flex flex-col gap-2.5 rounded-[12px] p-3 bg-[#f5f5f7] dark:bg-white/[0.06]">
      <div class="flex items-center gap-2">
        <input
          :value="link"
          readonly
          class="flex-1 min-w-0 h-8 px-2.5 rounded-[7px] text-[12.5px] bg-white dark:bg-black/30 outline-none"
          :aria-label="$t('share-link')"
          @focus="($event.target as HTMLInputElement).select()"
        />
        <button
          type="button"
          class="h-8 px-3 rounded-[7px] text-[12.5px] font-semibold text-white transition-colors"
          :class="copied ? 'bg-[#34c759]' : 'bg-[#0077cc] hover:bg-[#006bb8]'"
          @click="copy"
        >
          {{ copied ? $t('copied') : $t('copy') }}
        </button>
      </div>
      <div class="flex items-center gap-3">
        <qrcode-vue :value="link" :size="96" level="M" :margin="1" class="rounded-[6px] bg-white shrink-0" />
        <div class="flex flex-col gap-1.5 text-[12.5px]">
          <p class="text-[#6e6e73] dark:text-gray-400 leading-snug">{{ $t('share-qr-hint') }}</p>
          <div class="flex gap-3">
            <a :href="link" target="_blank" rel="noopener noreferrer" class="font-medium text-[#0077cc] hover:underline">{{ $t('open') }}</a>
            <button v-if="canNativeShare" type="button" class="font-medium text-[#0077cc] hover:underline" @click="nativeShare">{{ $t('share-more') }}</button>
          </div>
        </div>
      </div>
    </div>
    <p v-else-if="status === 'error'" class="text-[12.5px] text-[#ff3b30]">{{ $t('went-wrong') }}</p>

    <button
      v-if="status !== 'ready'"
      type="button"
      class="h-9 rounded-[9px] bg-[#0077cc] hover:bg-[#006bb8] disabled:opacity-40 text-white text-[13.5px] font-semibold transition-colors"
      :disabled="status === 'working' || !rangeValid || (scope === 'pages' && !customPages)"
      @click="create"
    >
      {{ status === 'working' ? $t('share-creating') : $t('share-create') }}
    </button>
    </template>
  </div>
</template>

<style scoped>
.efv-label {
  margin-bottom: 2px;
  font-size: 11.5px;
  font-weight: 600;
  color: #6e6e73;
}
.dark .efv-label {
  color: #aeaeb2;
}
</style>
