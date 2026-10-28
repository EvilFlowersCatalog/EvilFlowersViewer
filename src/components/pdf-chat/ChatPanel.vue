<script setup lang="ts">
// Reading chat docked to the right of the page. The open publication is always
// the subject (shown, not removable); selections, explanations, regions and
// agent highlights are attached as chips. Messages go through the host's
// chatPackage, which streams the answer back.
import { computed, nextTick, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAssistantStore, useDocumentStore, useViewerStore } from '@/stores';
import ChatMessage from './ChatMessage.vue';
import ChatHistory from './ChatHistory.vue';
import ContextChip from './ContextChip.vue';

const { t } = useI18n();
const docStore = useDocumentStore();
const viewerStore = useViewerStore();
const assistantStore = useAssistantStore();

const input = ref('');
const inputRef = ref<HTMLTextAreaElement | null>(null);
const scrollRef = ref<HTMLDivElement | null>(null);
// Follow the stream only while the reader is at the bottom.
const stickToBottom = ref(true);

const canSend = computed(() => !!input.value.trim() && !assistantStore.isGenerating);
const showHistory = computed(() => assistantStore.chatView === 'history');

// Opening a past chat starts at its latest message.
watch(
  () => assistantStore.currentChatId,
  () => {
    stickToBottom.value = true;
    scrollToBottom();
  }
);

const suggestions = computed(
  () =>
    viewerStore.chatPackage?.suggestions ?? [
      t('chat-suggestion-summary'),
      t('chat-suggestion-page'),
      t('chat-suggestion-books'),
    ]
);

const scrollToBottom = () =>
  nextTick(() => {
    if (scrollRef.value && stickToBottom.value) scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
  });

const onScroll = () => {
  const el = scrollRef.value;
  if (el) stickToBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
};

watch(
  () => assistantStore.messages.map((m) => m.text.length + (m.entries?.length ?? 0)).join(),
  scrollToBottom
);

const autosize = () => {
  const el = inputRef.value;
  if (!el) return;
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
};

const send = (text = input.value) => {
  if (!text.trim() || assistantStore.isGenerating) return;
  stickToBottom.value = true;
  assistantStore.sendMessage(text);
  input.value = '';
  nextTick(autosize);
};

const onKeydown = (event: KeyboardEvent) => {
  // Keep the viewer's single-key shortcuts (f, s, arrows, ...) out of the input.
  event.stopPropagation();
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    send();
  }
};

watch(
  () => assistantStore.focusInputTick,
  () => nextTick(() => inputRef.value?.focus()),
  { immediate: true }
);
</script>

<template>
  <aside
    data-chat-panel
    class="flex flex-col w-[360px] max-w-full shrink-0 h-full bg-surface border-l border-efv-border text-efv-text"
    :class="docStore.isMobile ? 'absolute inset-y-0 right-0 z-40 w-full shadow-xl' : ''"
    role="complementary"
    :aria-label="$t('assistant')"
  >
    <!-- Header -->
    <div class="flex items-center gap-2 px-3 h-11 border-b border-efv-border shrink-0">
      <svg aria-hidden="true" class="size-4 text-secondary shrink-0" viewBox="0 0 20 20" fill="none">
        <path d="M10 2.5l1.6 4.2 4.4.3-3.4 2.8 1.1 4.3L10 11.7l-3.7 2.4 1.1-4.3L4 7l4.4-.3z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
      </svg>
      <h2 class="flex-1 text-[13px] font-semibold uppercase tracking-[0.1px]">
        {{ showHistory ? $t('chat-history') : $t('assistant') }}
      </h2>
      <button
        v-if="assistantStore.hasHistory()"
        type="button"
        class="p-1.5 rounded-[5px] transition-colors"
        :class="
          showHistory
            ? 'text-secondary bg-accent-soft'
            : 'text-efv-muted hover:text-efv-text hover:bg-black/5 dark:hover:bg-white/10'
        "
        :title="$t('chat-history')"
        :aria-label="$t('chat-history')"
        :aria-pressed="showHistory"
        @click="assistantStore.toggleHistory"
      >
        <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="none">
          <path d="M3.5 10a6.5 6.5 0 1 0 1.9-4.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          <path d="M3 3.5v2.5h2.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M10 6.5V10l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        class="p-1.5 rounded-[5px] text-efv-muted hover:text-efv-text hover:bg-black/5 dark:hover:bg-white/10 disabled:opacity-40"
        :disabled="assistantStore.isGenerating || (!assistantStore.messages.length && !showHistory)"
        :title="$t('chat-new')"
        :aria-label="$t('chat-new')"
        @click="assistantStore.resetChat"
      >
        <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="none">
          <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
        </svg>
      </button>
      <button
        type="button"
        class="p-1.5 rounded-[5px] text-efv-muted hover:text-efv-text hover:bg-black/5 dark:hover:bg-white/10"
        :aria-label="$t('close')"
        @click="assistantStore.isChatOpen = false"
      >
        <svg aria-hidden="true" class="size-4" viewBox="0 0 20 20" fill="none">
          <path d="M9 5l5 5-5 5M4 5l5 5-5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>

    <!-- History list replaces the conversation while open -->
    <ChatHistory v-if="showHistory" />

    <template v-else>
    <!-- Subject: the open publication (implicit, cannot be removed) -->
    <div class="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-efv-muted border-b border-efv-border shrink-0">
      <svg aria-hidden="true" class="size-3 shrink-0" viewBox="0 0 20 20" fill="none">
        <path d="M4 3h9l3 3v11H4z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round" />
      </svg>
      <span class="truncate">
        {{ assistantStore.isCurrentChatReadOnly ? $t('chat-about-other-book') : $t('chat-about-book') }}
      </span>
      <span class="ml-auto shrink-0">{{ $t('page-short', { page: docStore.activePage }) }}</span>
    </div>

    <!-- Messages -->
    <div ref="scrollRef" class="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3" aria-live="polite" @scroll="onScroll">
      <div v-if="!assistantStore.messages.length" class="m-auto flex flex-col items-center gap-3 text-center px-2">
        <p class="text-[12px] leading-[17px] text-efv-muted">{{ $t('chat-empty') }}</p>
        <div class="flex flex-col gap-1.5 w-full">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            type="button"
            class="px-3 py-2 rounded-[8px] text-[11px] text-left bg-field text-[#333] hover:bg-accent-soft hover:text-accent-ink dark:bg-white/5 dark:text-gray-200 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
            @click="send(suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>
      <ChatMessage v-for="message in assistantStore.messages" :key="message.id" :message="message" />
    </div>

    <!-- A chat about another publication can be read, not continued -->
    <div
      v-if="assistantStore.isCurrentChatReadOnly"
      class="shrink-0 border-t border-efv-border px-3 py-2.5 flex items-center gap-2"
    >
      <p class="flex-1 text-[11px] leading-[15px] text-efv-muted">{{ $t('chat-read-only') }}</p>
      <button
        type="button"
        class="shrink-0 h-7 px-3 rounded-[5px] text-[11px] font-medium bg-secondary text-white hover:bg-secondary-strong"
        @click="assistantStore.resetChat"
      >
        {{ $t('chat-new') }}
      </button>
    </div>

    <!-- Composer -->
    <div v-else class="shrink-0 border-t border-efv-border p-2 flex flex-col gap-1.5">
      <div v-if="assistantStore.pendingContexts.length" class="flex flex-wrap gap-1">
        <ContextChip
          v-for="(ctx, index) in assistantStore.pendingContexts"
          :key="index"
          :context="ctx"
          removable
          @remove="assistantStore.removeContext(index)"
        />
      </div>
      <!-- One text line (5.5px + 17px + 5.5px) is as tall as the 28px send button, so
           they line up; longer text grows upward and the button stays at the bottom. -->
      <div class="flex items-end gap-1.5 rounded-[8px] border border-efv-border bg-white dark:bg-[#262626] pl-2.5 pr-1 py-1 transition-colors focus-within:border-secondary">
        <textarea
          ref="inputRef"
          v-model="input"
          rows="1"
          class="efv-bare-input flex-1 block resize-none bg-transparent outline-none py-[5.5px] text-[12px] leading-[17px] text-efv-text placeholder:text-efv-muted max-h-[140px]"
          :placeholder="assistantStore.pendingContexts.length ? $t('chat-placeholder-context') : $t('chat-placeholder')"
          :aria-label="$t('chat-placeholder')"
          @input="autosize"
          @keydown="onKeydown"
        />
        <button
          type="button"
          class="shrink-0 size-7 flex items-center justify-center rounded-[6px] transition-colors"
          :class="
            canSend
              ? 'bg-secondary text-white hover:bg-secondary-strong'
              : 'bg-gray-100 text-gray-400 dark:bg-white/10 dark:text-gray-500 cursor-default'
          "
          :disabled="!canSend"
          :aria-label="$t('chat-send')"
          @click="send()"
        >
          <svg aria-hidden="true" class="size-3.5" viewBox="0 0 20 20" fill="none">
            <path d="M3 10l14-6-6 14-2-6z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </div>
    </template>
  </aside>
</template>
