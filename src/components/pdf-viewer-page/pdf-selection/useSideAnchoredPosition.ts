import { ref } from 'vue';

// Positions a fixed popup right of `anchorEl` (the PDF page body). Falls back
// to hugging the right edge of the viewport when there isn't room — e.g. at
// extreme zoom where the page body doesn't leave space on its right.
export const useSideAnchoredPosition = (popupWidth = 300, margin = 12) => {
  const style = ref<{ top: string; left: string }>({
    top: `${margin}px`,
    left: `${margin}px`,
  });

  const calculate = (anchorEl: HTMLElement | null) => {
    const rect = anchorEl?.getBoundingClientRect() ?? null;
    const fitsRight = !!rect && rect.right + margin + popupWidth <= window.innerWidth;

    style.value = fitsRight
      ? {
          top: `${Math.max(margin, rect!.top)}px`,
          left: `${rect!.right + margin}px`,
        }
      : {
          top: `${margin}px`,
          left: `${window.innerWidth - popupWidth - margin}px`,
        };
  };

  return { style, calculate };
};
