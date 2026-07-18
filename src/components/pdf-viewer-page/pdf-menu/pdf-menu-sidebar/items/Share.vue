<script setup lang="ts">
import { DAY, ERROR_LINK } from '@/assets/utils/constans';
import { MODAL_CONTENT } from '@/assets/utils/enums';
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

const handlePagesInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const eventInput = target.value;
  const pattern = /^((([0-9]+),?)*|(([0-9]+)-?))*$/;
  const pattern2 = /^.*(([0-9]+)-([0-9]+)-)+$/;

  if (pattern.test(eventInput) && !pattern2.test(eventInput)) {
    inputValue.value = eventInput;
    const last = eventInput[eventInput.length - 1];
    isInappropriate.value = last === ',' || last === '-';
  } else {
    target.value = inputValue.value;
  }
};

const handleSubmit = async () => {
  viewerStore.shareLink = '';

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
    viewerStore.shareLink = url.toString();
  }
};
</script>

<template>
  <form @submit.prevent="handleSubmit" class="flex flex-col gap-[10px] h-full">
    <!-- Page range input -->
    <div class="flex items-center bg-white dark:bg-white/5 rounded-[7px] shadow-[0px_4px_12px_rgba(0,0,0,0.1)] px-[8px] h-[28px]">
      <span class="text-[10px] text-[#333] dark:text-gray-300 tracking-[0.1px] leading-[20px] shrink-0">{{ $t('pages') }}:</span>
      <input
        name="share-input"
        class="flex-1 min-w-0 ml-[4px] bg-transparent text-[10px] font-light text-[#333] dark:text-gray-200 placeholder:text-[#b1b1b1] tracking-[0.1px] outline-none"
        type="text"
        :aria-label="$t('pages')"
        :placeholder="'1, 4-7, 10'"
        @keydown.stop
        @input="handlePagesInput"
      />
    </div>

    <!-- Add edits radio -->
    <label class="flex items-center gap-[6px] cursor-pointer select-none pl-[5px]">
      <span
        aria-hidden="true"
        class="size-[11px] rounded-full border border-[#333] dark:border-gray-400 flex items-center justify-center shrink-0"
      >
        <span v-if="useEdit" class="size-[5px] rounded-full bg-[#333] dark:bg-gray-200"></span>
      </span>
      <input type="checkbox" v-model="useEdit" class="sr-only" />
      <span class="text-[10px] text-[#333] dark:text-gray-300 leading-[1.4]">{{ $t('enable-edit') }}</span>
    </label>

    <!-- Lifespan -->
    <div class="flex flex-col gap-[6px] pl-[5px]">
      <span class="text-[10px] font-semibold text-[#333] dark:text-gray-200 leading-[1.4]">{{ $t('lifespan-1').split(' ')[0] }}:</span>
      <label
        v-for="item of lifespanButtons"
        :key="item.name"
        class="flex items-center gap-[8px] cursor-pointer select-none pl-[8px]"
        @click.prevent="expaire = item.value"
      >
        <span
          class="size-[11px] rounded-full border flex items-center justify-center shrink-0"
          :class="item.value === expaire ? 'border-[#333] dark:border-gray-300' : 'border-[#333] dark:border-gray-400'"
        >
          <span v-if="item.value === expaire" class="size-[5px] rounded-full bg-[#333] dark:bg-gray-200"></span>
        </span>
        <span class="text-[10px] text-[#333] dark:text-gray-300 leading-[1.4]">{{ $t(item.name).split(' ').slice(1).join(' ') }}</span>
      </label>
    </div>

    <!-- Submit -->
    <div class="flex justify-center pt-[10px]">
      <button
        v-if="!isInappropriate"
        type="submit"
        class="bg-[#0077cc] hover:bg-[#0066b3] text-[#f5f7fa] text-[10px] font-semibold leading-[1.4] rounded-[7px] px-[10px] h-[20px] shadow-[0px_4px_6px_rgba(0,0,0,0.1)] transition-colors"
      >
        {{ $t('qr-code') }}
      </button>
    </div>
  </form>
</template>
