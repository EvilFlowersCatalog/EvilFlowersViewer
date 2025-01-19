<script setup lang="ts">
import { Loader } from '@/components/pdf-aids';
import { useViewerStore } from '@/stores';
import QrcodeVue from 'qrcode.vue';
import { ERROR_LINK } from '@/assets/utils/constans';

// Data
const viewerStore = useViewerStore();
</script>

<template>
  <!-- Loading -->
  <Loader
    v-if="viewerStore.shareLink === ''"
    :size="70"
    color="white"
    class="my-5"
  />

  <!-- If something went wrong -->
  <p
    v-else-if="viewerStore.shareLink === ERROR_LINK"
    class="text-lg text-center"
  >
    {{ $t('went-wrong') }}
  </p>

  <!-- QR code -->
  <qrcode-vue
    v-else
    id="QRCode"
    :value="viewerStore.shareLink"
    :size="250"
    level="H"
    :margin="2"
    class="bg-white rounded-md mx-auto my-5"
  />
</template>
