<script setup lang="ts">
import { DAY, ERROR_LINK } from '@/assets/utils/constans';
import { MODAL_CONTENT } from '@/assets/utils/enums';
import { ValidationInput } from '@/components/pdf-aids';
import { useDocumentStore, useViewerStore } from '@/stores';
import { FaShare } from '@kalimahapps/vue-icons';
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
  viewerStore.setShareLink(''); // Reset link

  const expaireDate = new Date(); // create new date
  expaireDate.setHours(expaireDate.getHours() + expaire.value); // set hours with setted expaire (+ 24(day) / +24*7(week) / +24*30(month))

  const expaireDateISO: string = expaireDate.toISOString(); // ISO string format
  const pages: string | null = inputValue.value ? inputValue.value : null; // if empty set to null
  inputValue.value = ''; // Reset input

  // open qr code
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
  <form @submit.prevent="handleSubmit" class="flex flex-col h-full gap-5">
    <ValidationInput
      @update-input="(value: string) => inputValue = value"
      @is-inappropriate="(value: boolean)=> isInappropriate = value"
      @edit-usage="(value: boolean)=> useEdit = value"
    />

    <!-- Lifespan buttons -->
    <div class="flex flex-col gap-2">
      <div class="flex flex-col justify-evenly items-start gap-2">
        <div
          class="flex flex-row-reverse items-center gap-2 pl-1"
          v-for="item of lifespanButtons"
          :key="item.name"
        >
          <label class="cursor-pointer" @click="setExpaire(item.value)">{{
            $t(item.name)
          }}</label>
          <input
            name="expaire-date"
            @click="setExpaire(item.value)"
            :checked="item.value === expaire"
            type="radio"
            class="appearance-none h-3 w-3 text-sm bg-white hover:ring hover:ring-secondary text-black rounded-md checked:bg-secondary cursor-pointer"
          />
        </div>
      </div>
    </div>

    <!-- Spacer -->
    <span class="flex flex-1"></span>

    <!-- Submit button -->
    <button
      v-if="!isInappropriate"
      type="submit"
      class="w-full bg-secondary py-2 flex items-center justify-center rounded-md"
    >
      <FaShare class="icon size-8" />
    </button>
  </form>
</template>
