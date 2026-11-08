<script setup lang="ts">
// Small "Beta" pill for AI features that are still being tuned.
</script>

<template>
  <span
    class="inline-flex items-center shrink-0 h-[15px] px-1.5 rounded-full border border-amber-400/70 bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-300/40 text-[9px] font-semibold uppercase tracking-[0.4px] leading-none align-middle select-none"
    :title="$t('beta-hint')"
  >
    {{ $t('beta') }}
  </span>
</template>
