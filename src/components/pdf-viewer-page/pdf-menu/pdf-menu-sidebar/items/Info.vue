<script setup lang="ts">
import type { IPDFMetadataProps } from '@/assets/utils/interfaces';
import { useDocumentStore } from '@/stores';
import { ref, onMounted, computed, toRaw, watch } from 'vue';

const docStore = useDocumentStore();
const metadata = ref<Partial<IPDFMetadataProps>>({});
let pdf = toRaw(docStore.pdf);

// Get wanted metadata
const filteredMetadata = computed(() => {
  const result: Partial<IPDFMetadataProps> = {
    Author: metadata.value.Author,
    Title: metadata.value.Title,
    Pages: metadata.value.Pages,
    CreationDate: metadata.value.CreationDate,
    ModificationDate: metadata.value.ModificationDate,
    Description: metadata.value.Description,
    Identificator: metadata.value.Identificator,
    Creator: metadata.value.Creator,
    Keywords: metadata.value.Keywords,
    Producer: metadata.value.Producer,
    Subject: metadata.value.Subject,
    Language: metadata.value.Language,
    PDFFormatVersion: metadata.value.PDFFormatVersion,
  };
  return Object.fromEntries(
    Object.entries(result).filter(([_, value]) => value)
  );
});

// Formate date
const formatDate = (dateString: string): string => {
  const year = Number(dateString.substring(2, 4)) + 2000;
  const month = Number(dateString.substring(6, 8)) - 1;
  const day = Number(dateString.substring(8, 10));
  const hour = Number(dateString.substring(10, 12));
  const minute = Number(dateString.substring(12, 14));
  const second = Number(dateString.substring(14, 16));
  const newDate = new Date(year, month, day, hour, minute, second);
  return newDate.toLocaleString([], {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timeZoneName: 'short',
  });
};

// On mount, get metada from pdf
onMounted(async () => {
  if (pdf?.getMetadata) {
    const meta = (await pdf.getMetadata()) as any;

    // Get creation date, if exists
    if (meta.info?.CreationDate?.startsWith('D:')) {
      meta.info.CreationDate = formatDate(meta.info.CreationDate);
    }
    // Get modified date, if exists
    if (meta.info?.ModDate?.startsWith('D:')) {
      meta.info.ModDate = formatDate(meta.info.ModDate);
    }
    metadata.value = meta.info;
  }
});

// When pdf change, update variable
watch(
  () => docStore.pdf,
  () => {
    pdf = docStore.pdf;
  }
);
</script>

<template>
  <div class="flex flex-1 flex-col gap-2">
    <!-- Each metadata info -->
    <div
      v-for="(value, key) in filteredMetadata"
      :key="key"
      class="flex flex-col"
    >
      <h1 class="text-lg text-secondary">{{ $t(key.toString()) }}</h1>
      <span class="text-[15px] break-words">{{ value }}</span>
    </div>
  </div>
</template>
