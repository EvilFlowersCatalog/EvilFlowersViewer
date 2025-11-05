<script setup lang="ts">
import { ref } from 'vue';
import { AnOutlinedInfoCircle } from '@kalimahapps/vue-icons';
import ToolTip from './ToolTip.vue';

// Props
const emit = defineEmits<{
  (event: 'edit-usage', usage: boolean): void;
  (event: 'update-input', input: string): void;
  (event: 'is-inappropriate', inappropriate: boolean): void;
}>();

// Data
const inputValue = ref<string>('');
const checked = ref<boolean>(false);

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const eventInput = target.value;
  const pattern = /^((([0-9]+),?)*|(([0-9]+)-?))*$/; // only 1,2-6,10,3....
  const pattern2 = /^.*(([0-9]+)-([0-9]+)-)+$/; // only ...1-2- // not accepting

  if (pattern.test(eventInput) && !pattern2.test(eventInput)) {
    inputValue.value = eventInput;
    emit('update-input', eventInput);
    if (
      eventInput[eventInput.length - 1] === ',' ||
      eventInput[eventInput.length - 1] === '-'
    ) {
      // if string ends with , or - do not share
      emit('is-inappropriate', true);
    } else {
      // it's okay
      emit('is-inappropriate', false);
    }
  } else {
    target.value = inputValue.value;
  }
};

const handleUsageChange = () => {
  checked.value = !checked.value;
  emit('edit-usage', checked.value);
};
</script>

<template>
  <div class="flex flex-col w-full gap-1">
    <!-- Input -->
    <div class="flex gap-2 justify-between items-center">
      <input
        name="share-input"
        class="input"
        type="text"
        :placeholder="$t('pages')"
        @keydown.stop
        @input="handleInput"
      />
      <ToolTip position="left" :text="$t('input-pages-info')">
        <AnOutlinedInfoCircle class="icon cursor-default" />
      </ToolTip>
    </div>

    <!-- Checkbox for enaling edit -->
    <div class="flex items-center gap-4 pl-1">
      <input
        type="checkbox"
        name="enable-edit"
        @click="handleUsageChange"
        :checked="checked"
        class="checkbox"
      />

      <label
        for="enable-edit"
        class="cursor-pointer select-none"
        @click="handleUsageChange"
      >
        {{ $t('enable-edit') }}
      </label>
    </div>
  </div>
</template>
