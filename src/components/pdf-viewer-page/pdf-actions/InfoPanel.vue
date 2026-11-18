<script setup lang="ts">
// About this document: what the PDF says about itself, plainly.
import { computed, ref, toRaw, watch } from 'vue';
import { useDocumentStore } from '@/stores';

const docStore = useDocumentStore();
const info = ref<Record<string, string>>({});
const pdfVersion = ref<string | null>(null);

// "D:20230115093000+01'00'" → a readable local date.
const pdfDate = (value: string | undefined) => {
  const m = value?.match(/^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?/);
  if (!m) return value ?? null;
  const date = new Date(+m[1], (+(m[2] ?? 1) || 1) - 1, +(m[3] ?? 1) || 1, +(m[4] ?? 0), +(m[5] ?? 0));
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
};

watch(
  () => docStore.pdf,
  async (pdf) => {
    info.value = {};
    const doc = toRaw(pdf);
    if (!doc) return;
    try {
      const meta = (await doc.getMetadata()) as { info?: Record<string, any> };
      const i = meta.info ?? {};
      pdfVersion.value = i.PDFFormatVersion ?? null;
      info.value = Object.fromEntries(
        Object.entries({
          Title: i.Title,
          Author: i.Author,
          Subject: i.Subject,
          Keywords: i.Keywords,
          CreationDate: pdfDate(i.CreationDate),
          ModificationDate: pdfDate(i.ModDate),
          Creator: i.Creator,
          Producer: i.Producer,
        }).filter(([, v]) => typeof v === 'string' && v.trim())
      ) as Record<string, string>;
    } catch {
      // no metadata
    }
  },
  { immediate: true }
);

const size = computed(() => {
  const bytes = docStore.downloadProgress?.total;
  if (!bytes) return null;
  return bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} kB`;
});
</script>

<template>
  <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-[13px]">
    <template v-for="(value, key) in info" :key="key">
      <dt class="text-[#6e6e73] dark:text-gray-400">{{ $t(String(key)) }}</dt>
      <dd class="m-0 break-words">{{ value }}</dd>
    </template>
    <dt class="text-[#6e6e73] dark:text-gray-400">{{ $t('Pages') }}</dt>
    <dd class="m-0 tabular-nums">{{ docStore.totalPages }}</dd>
    <template v-if="size">
      <dt class="text-[#6e6e73] dark:text-gray-400">{{ $t('file-size') }}</dt>
      <dd class="m-0 tabular-nums">{{ size }}</dd>
    </template>
    <template v-if="pdfVersion">
      <dt class="text-[#6e6e73] dark:text-gray-400">{{ $t('PDFFormatVersion') }}</dt>
      <dd class="m-0">PDF {{ pdfVersion }}</dd>
    </template>
  </dl>
</template>
