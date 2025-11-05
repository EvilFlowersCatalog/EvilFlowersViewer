<script setup lang="ts">
import { ref, computed } from 'vue';
import DOMPurify from 'dompurify';

// Define props
const props = defineProps({
  position: {
    type: String,
    required: true,
    validator: (value: string) =>
      ['top', 'left', 'bottom', 'right'].includes(value),
  },
  text: {
    type: String,
    required: true,
  },
});

// Tooltip visibility state
const isTooltipVisible = ref(false);

// Tooltip position styles
const tooltipPosition = ref<Record<string, string>>({});

const calculateTooltipPosition = (event: MouseEvent) => {
  const button = event.target as HTMLElement;
  const buttonRect = button.getBoundingClientRect();

  const tooltipStyles: Record<string, string> = {
    top: `${buttonRect.top - 50}px`,
    left: `${buttonRect.left + buttonRect.width / 2}px`,
    transform: 'translateX(-50%)',
  };

  switch (props.position) {
    case 'top':
      tooltipStyles.top = `${buttonRect.top - 40}px`;
      tooltipStyles.left = `${buttonRect.left + buttonRect.width / 2}px`;
      tooltipStyles.transform = 'translateX(-50%)';
      break;
    case 'bottom':
      tooltipStyles.top = `${buttonRect.bottom + 10}px`;
      tooltipStyles.left = `${buttonRect.left + buttonRect.width / 2}px`;
      tooltipStyles.transform = 'translateX(-50%)';
      break;
    case 'left':
      tooltipStyles.top = `${buttonRect.top + buttonRect.height / 2}px`;
      tooltipStyles.left = `${buttonRect.left - 10}px`;
      tooltipStyles.transform = 'translateY(-50%) translateX(-100%)';
      break;
    case 'right':
      tooltipStyles.top = `${buttonRect.top + buttonRect.height / 2}px`;
      tooltipStyles.left = `${buttonRect.right + 10}px`;
      tooltipStyles.transform = 'translateY(-50%)';
      break;
  }

  tooltipPosition.value = tooltipStyles;
};

// Computed property to safely render text with line breaks
const sanitizedText = computed(() => {
  // Replace newlines (\n) with <br> tags
  const textWithLineBreaks = props.text.replace(/\n/g, '<br>');

  return DOMPurify.sanitize(textWithLineBreaks);
});
</script>

<template>
  <div
    class="relative inline-block"
    @mouseenter="isTooltipVisible = true"
    @mouseleave="isTooltipVisible = false"
    @mousemove="calculateTooltipPosition"
  >
    <slot />

    <div
      v-if="isTooltipVisible"
      class="w-max text-center max-w-44 fixed px-3 py-2 text-primary bg-secondary border border-primary rounded text-xs z-50 pointer-events-none"
      :style="tooltipPosition"
    >
      <!-- Use sanitizedText here -->
      <span v-html="sanitizedText"></span>
    </div>
  </div>
</template>
