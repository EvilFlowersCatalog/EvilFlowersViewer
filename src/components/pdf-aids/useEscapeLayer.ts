import { onBeforeUnmount, watch } from 'vue';

/**
 * Escape closes only the topmost open layer of the viewer (lightbox, page card,
 * selection menu, explain, modal, sidebar panel), in the order they opened.
 * PDFViewer's key handler calls `closeTopLayer`; nothing else reacts to Escape.
 */
const stack: Array<() => void> = [];

/** Closes the most recently opened layer; false when none is open. */
export const closeTopLayer = () => {
  const top = stack[stack.length - 1];
  if (!top) return false;
  top();
  return true;
};

export const useEscapeLayer = (isOpen: () => boolean, close: () => void) => {
  const layer = () => close();
  const remove = () => {
    const index = stack.indexOf(layer);
    if (index >= 0) stack.splice(index, 1);
  };
  watch(
    isOpen,
    (open) => {
      remove();
      if (open) stack.push(layer);
    },
    { immediate: true }
  );
  onBeforeUnmount(remove);
};
