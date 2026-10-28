<script setup lang="ts">
// The reader's past chats: this book's first, then the rest. Opening a chat
// about another book shows it read-only; it cannot be continued here.
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAssistantStore, useViewerStore } from '@/stores';
import type { IChatSummary } from '@/assets/utils/interfaces';
import { Loader } from '@/components/pdf-aids';

const { t, locale } = useI18n();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();

const groups = computed(() =>
  [
    { key: 'chat-history-this-book', items: assistantStore.chats.filter((c) => c.aboutThisBook) },
    { key: 'chat-history-other', items: assistantStore.chats.filter((c) => !c.aboutThisBook) },
  ].filter((g) => g.items.length)
);

// Relative for recent chats, a date for older ones.
const when = (iso: string) => {
  const date = new Date(iso);
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days < 1) return date.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' });
  if (days < 7) return t('chat-history-days-ago', { n: days });
  return date.toLocaleDateString(locale.value, { day: 'numeric', month: 'short', year: 'numeric' });
};

const remove = (chat: IChatSummary) => assistantStore.deleteChat(chat.id);
</script>

<template>
  <div class="flex-1 overflow-y-auto px-2 py-2 flex flex-col gap-3">
    <div v-if="assistantStore.chatsLoading && !assistantStore.chats.length" class="flex items-center justify-center gap-2 py-8">
      <span class="size-4 inline-flex"><Loader :size="16" color="#0077cc" :label="$t('load')" /></span>
    </div>

    <div v-else-if="assistantStore.chatsFailed" class="flex flex-col items-center gap-2 py-8 text-center">
      <p class="text-[11px] text-efv-muted">{{ $t('chat-history-failed') }}</p>
      <button
        type="button"
        class="h-7 px-3 rounded-[5px] text-[11px] font-medium bg-accent-soft text-accent-ink hover:brightness-95"
        @click="assistantStore.loadChats(true)"
      >
        {{ $t('chat-history-retry') }}
      </button>
    </div>

    <p v-else-if="!assistantStore.chats.length" class="py-8 text-center text-[11px] text-efv-muted">
      {{ $t('chat-history-empty') }}
    </p>

    <section v-for="group in groups" :key="group.key" class="flex flex-col gap-1">
      <h3 class="px-1.5 text-[10px] font-semibold uppercase tracking-[0.4px] text-efv-muted">{{ $t(group.key) }}</h3>
      <ul class="list-none m-0 p-0 flex flex-col gap-0.5">
        <li v-for="chat in group.items" :key="chat.id" class="group relative">
          <button
            type="button"
            class="w-full flex flex-col gap-0.5 text-left pl-2.5 pr-8 py-2 rounded-[6px] transition-colors"
            :class="
              chat.id === assistantStore.currentChatId
                ? 'bg-accent-soft'
                : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
            "
            :aria-current="chat.id === assistantStore.currentChatId ? 'true' : undefined"
            @click="assistantStore.openPastChat(chat)"
          >
            <span class="text-[12px] leading-[16px] font-medium text-efv-text line-clamp-2">{{ chat.title }}</span>
            <span class="flex items-center gap-1.5 text-[10px] text-efv-muted">
              <span>{{ when(chat.updatedAt) }}</span>
              <template v-if="chat.messageCount">
                <span aria-hidden="true">·</span>
                <span>{{ $t('chat-history-messages', { n: chat.messageCount }) }}</span>
              </template>
              <span
                v-if="assistantStore.openingChatId === chat.id"
                class="size-3 inline-flex ml-auto"
              ><Loader :size="12" color="#0077cc" :label="$t('load')" /></span>
            </span>
          </button>
          <button
            v-if="viewerStore.chatPackage?.deleteChatFunc"
            type="button"
            class="absolute top-1.5 right-1.5 size-6 flex items-center justify-center rounded-[5px] text-efv-muted opacity-0 group-hover:opacity-100 focus-visible:opacity-100 hover:text-red hover:bg-red/10 transition"
            :title="$t('delete')"
            :aria-label="$t('delete')"
            @click="remove(chat)"
          >
            <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
              <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
