<script setup lang="ts">
import { DAY, ERROR_LINK } from '@/assets/utils/constans';
import { MODAL_CONTENT } from '@/assets/utils/enums';
import { ValidationInput } from '@/components/pdf-aids';
import { useDocumentStore, useViewerStore } from '@/stores';
import { ref } from 'vue';

const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const expaire = ref<number>(DAY);
const useEdit = ref<boolean>(false);
const inputValue = ref<string>('');
const isInappropriate = ref<boolean>(false);
const lifespanButtons: { name: string; value: number }[] = [
  { name: 'lifespan-1', value: DAY },
  { name: 'lifespan-7', value: DAY * 7 },
  { name: 'lifespan-30', value: DAY * 30 },
];

const setExpaire = (value: number) => {
  expaire.value = value;
};

const handleSubmit = async () => {
  viewerStore.setShareLink('');

  const expaireDate = new Date();
  expaireDate.setHours(expaireDate.getHours() + expaire.value);

  const expaireDateISO: string = expaireDate.toISOString();
  const pages: string | null = inputValue.value ? inputValue.value : null;
  inputValue.value = '';

  docStore.setModalContent(MODAL_CONTENT.QRCode);

  let link: string = await viewerStore.shareFunction!(pages, expaireDateISO);
  link = link ? link : ERROR_LINK;

  if (link !== ERROR_LINK) {
    const url = new URL(link);
    url.searchParams.set('annotations', `${useEdit.value}`);
    viewerStore.setShareLink(url.toString());
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-5 h-full">
    <!-- Page range input -->
    <div class="flex flex-col gap-1.5">
      <ValidationInput
        @update-input="(value: string) => inputValue = value"
        @is-inappropriate="(value: boolean) => isInappropriate = value"
        @edit-usage="(value: boolean) => useEdit = value"
      />
    </div>

    <!-- Lifespan selector -->
    <div class="flex flex-col gap-2">
      <span class="sidebar-label">{{ $t('lifespan-1').split(' ')[0] }}</span>
      <div class="flex flex-col gap-2">
        <label
          v-for="item of lifespanButtons"
          :key="item.name"
          class="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          @click="setExpaire(item.value)"
        >
          <div
            class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
            :class="item.value === expaire
              ? 'border-secondary bg-secondary'
              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent'"
          >
            <div v-if="item.value === expaire" class="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>
          <span class="text-sm text-gray-700 dark:text-gray-300 select-none">{{ $t(item.name) }}</span>
        </label>
      </div>
    </div>

    <span class="flex-1"></span>

    <!-- Submit button -->
    <button
      v-if="!isInappropriate"
      type="submit"
      class="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
    >
      <svg class="size-4" viewBox="0 0 20 20" fill="none">
        <path d="M15 6.66675C16.3807 6.66675 17.5 5.54746 17.5 4.16675C17.5 2.78604 16.3807 1.66675 15 1.66675C13.6193 1.66675 12.5 2.78604 12.5 4.16675C12.5 5.54746 13.6193 6.66675 15 6.66675Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M5 12.5C6.38071 12.5 7.5 11.3807 7.5 10C7.5 8.61929 6.38071 7.5 5 7.5C3.61929 7.5 2.5 8.61929 2.5 10C2.5 11.3807 3.61929 12.5 5 12.5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M15 18.3333C16.3807 18.3333 17.5 17.214 17.5 15.8333C17.5 14.4525 16.3807 13.3333 15 13.3333C13.6193 13.3333 12.5 14.4525 12.5 15.8333C12.5 17.214 13.6193 18.3333 15 18.3333Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M7.15833 11.2583L12.85 14.575" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12.8417 5.42505L7.15833 8.74172" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      {{ $t('share') }}
    </button>
  </form>
</template>
