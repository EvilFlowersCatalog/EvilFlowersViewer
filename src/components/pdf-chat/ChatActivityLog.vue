<script setup lang="ts">
// What the assistant did while answering (host `onActivity` events), as one
// collapsed muted line above the answer that expands to a compact list of tool
// calls. Rows that found publications expand again to their titles.
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { IChatActivity } from '@/assets/utils/interfaces';

const props = defineProps<{ activities: IChatActivity[]; running: boolean }>();

const { t } = useI18n();

const open = ref(false);
const openRows = ref<Set<string>>(new Set());

const toggleRow = (id: string) => {
  const next = new Set(openRows.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  openRows.value = next;
};

// A call still counts as running only while the turn is.
const isRunning = (activity: IChatActivity) => props.running && !activity.done;

const current = computed(() => (props.running ? [...props.activities].reverse().find((a) => !a.done) : undefined));

const lowerFirst = (text: string) => text.charAt(0).toLocaleLowerCase() + text.slice(1);

// "Searched the catalog 2×, read the publication"
const summary = computed(() => {
  const counts = new Map<string, number>();
  for (const activity of props.activities) counts.set(activity.label, (counts.get(activity.label) ?? 0) + 1);
  return [...counts]
    .map(([label, n], index) => `${index ? lowerFirst(label) : label}${n > 1 ? ` ${n}×` : ''}`)
    .join(', ');
});

// [3, 4, 5, 8] -> "3–5, 8"
const pageRanges = (pages: number[]) => {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i];
    while (i + 1 < sorted.length && sorted[i + 1] === sorted[i] + 1) i++;
    parts.push(start === sorted[i] ? `${start}` : `${start}–${sorted[i]}`);
  }
  return parts.join(', ');
};

const meta = (activity: IChatActivity) => {
  const parts: string[] = [];
  if (activity.error) parts.push(t('chat-activity-failed'));
  if (typeof activity.count === 'number') parts.push(t('chat-activity-results', { n: activity.count }));
  if (activity.pages?.length) {
    parts.push(
      activity.pages.length === 1
        ? t('page-short', { page: activity.pages[0] })
        : t('chat-activity-pages', { pages: pageRanges(activity.pages) })
    );
  }
  return parts.map((p) => ` · ${p}`).join('');
};
</script>

<template>
  <div v-if="activities.length" class="flex flex-col gap-1 text-[11px] leading-[15px]">
    <button
      type="button"
      class="self-start max-w-full flex items-center gap-1.5 text-efv-muted hover:text-efv-text transition-colors"
      :aria-expanded="open"
      :title="open ? $t('chat-activity-hide') : $t('chat-activity-show')"
      @click="open = !open"
    >
      <span v-if="current" class="size-1.5 shrink-0 rounded-full bg-secondary animate-pulse" aria-hidden="true" />
      <span class="truncate">{{ current ? current.label : summary }}</span>
      <svg
        aria-hidden="true"
        class="size-3 shrink-0 transition-transform"
        :class="{ 'rotate-180': open }"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <ul
      v-if="open"
      class="m-0 p-0 list-none flex flex-col rounded-[6px] border border-efv-border divide-y divide-efv-border overflow-hidden"
    >
      <li v-for="activity in activities" :key="activity.id" class="min-w-0">
        <component
          :is="activity.entries?.length ? 'button' : 'div'"
          :type="activity.entries?.length ? 'button' : undefined"
          class="w-full flex items-center gap-1.5 px-2 py-1 text-left min-w-0"
          :class="activity.entries?.length ? 'hover:bg-black/5 dark:hover:bg-white/5' : ''"
          :aria-expanded="activity.entries?.length ? openRows.has(activity.id) : undefined"
          @click="activity.entries?.length && toggleRow(activity.id)"
        >
          <span
            v-if="isRunning(activity)"
            class="size-1.5 shrink-0 rounded-full bg-secondary animate-pulse"
            aria-hidden="true"
          />
          <span class="flex-1 min-w-0 truncate">
            <span class="text-efv-muted">{{ activity.label }}</span>
            <template v-if="activity.query">
              {{ ' ' }}<span class="text-efv-text">{{ activity.query }}</span>
            </template>
            <span class="text-efv-muted">{{ meta(activity) }}</span>
          </span>
          <svg
            v-if="activity.entries?.length"
            aria-hidden="true"
            class="size-3 shrink-0 text-efv-muted transition-transform"
            :class="{ 'rotate-180': openRows.has(activity.id) }"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path d="M6 8l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </component>
        <ul
          v-if="activity.entries?.length && openRows.has(activity.id)"
          class="m-0 pl-4 pr-2 pb-1 list-none flex flex-col gap-0.5 text-efv-muted"
        >
          <li v-for="(entry, index) in activity.entries" :key="entry.id ?? index" class="truncate" :title="entry.title">
            {{ entry.title }}
          </li>
        </ul>
      </li>
    </ul>
  </div>
</template>
