<script setup lang="ts">
import { SIDEBAR_STATE } from '@/assets/utils/enums';
import { useDocumentStore } from '@/stores';
import { MdKeyboardDoubleArrowLeft } from '@kalimahapps/vue-icons';
import { Info, Share, Search, Print } from './items';
import ToolTip from '@/components/pdf-aids/ToolTip.vue';

const docStore = useDocumentStore();
</script>

<template>
  <!-- Container -->
  <div
    class="absolute top-0 z-10 p-2 h-full w-[85vw] max-w-72 transition-left duration-200"
    :class="[
      docStore.sidebarState === SIDEBAR_STATE.NULL ? '-left-72' : 'left-10',
    ]"
  >
    <!-- Content -->
    <div class="flex flex-col w-full h-full bg-primary rounded-md p-2">
      <!-- Header -->
      <div class="flex justify-between items-center gap-2 mb-4">
        <h1
          v-if="docStore.sidebarState !== SIDEBAR_STATE.NULL"
          class="uppercase text-xl font-extrabold text-secondary"
        >
          {{ $t(docStore.sidebarState) }}
        </h1>
        <ToolTip position="left" :text="$t('close')">
          <button
            class="w-full flex justify-end"
            @click="docStore.setSidebarState(SIDEBAR_STATE.NULL)"
          >
            <MdKeyboardDoubleArrowLeft class="icon hover:text-secondary" />
          </button>
        </ToolTip>
      </div>

      <!-- Main contnet -->
      <div class="w-full h-full overflow-auto">
        <Info v-if="docStore.sidebarState === SIDEBAR_STATE.INFO" />
        <Share v-if="docStore.sidebarState === SIDEBAR_STATE.SHARE" />
        <Search v-if="docStore.sidebarState === SIDEBAR_STATE.SEARCH" />
        <Print v-if="docStore.sidebarState === SIDEBAR_STATE.PRINT" />
      </div>
    </div>
  </div>
</template>
