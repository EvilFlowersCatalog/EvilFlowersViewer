import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import type { IPageBox } from '@/assets/utils/interfaces';

/**
 * Pointer position over the page body as page fractions (top-left origin), or
 * null when the pointer is elsewhere. Layers hit-test against this instead of
 * catching pointer events themselves, so text selection keeps working under
 * figures and highlights.
 */
export const usePagePointer = (pageBodyRef: Ref<HTMLElement | null>) => {
  const point = ref<{ x: number; y: number } | null>(null);
  let element: HTMLElement | null = null;

  const onMove = (event: MouseEvent) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    point.value = x >= 0 && x <= 1 && y >= 0 && y <= 1 ? { x, y } : null;
  };
  const onLeave = () => (point.value = null);

  const bind = (el: HTMLElement | null) => {
    element?.removeEventListener('mousemove', onMove);
    element?.removeEventListener('mouseleave', onLeave);
    element = el;
    element?.addEventListener('mousemove', onMove);
    element?.addEventListener('mouseleave', onLeave);
  };

  watch(pageBodyRef, bind, { immediate: true });
  onBeforeUnmount(() => bind(null));

  return point;
};

export const boxContains = (box: IPageBox, point: { x: number; y: number }, pad = 0.004) =>
  point.x >= box.x0 - pad && point.x <= box.x1 + pad && point.y >= box.y0 - pad && point.y <= box.y1 + pad;

export const unionBox = (boxes: IPageBox[]): IPageBox => ({
  x0: Math.min(...boxes.map((b) => b.x0)),
  y0: Math.min(...boxes.map((b) => b.y0)),
  x1: Math.max(...boxes.map((b) => b.x1)),
  y1: Math.max(...boxes.map((b) => b.y1)),
});

/** CSS that places an absolutely positioned element over `box` inside the page body. */
export const boxStyle = (box: IPageBox) => ({
  left: `${box.x0 * 100}%`,
  top: `${box.y0 * 100}%`,
  width: `${(box.x1 - box.x0) * 100}%`,
  height: `${(box.y1 - box.y0) * 100}%`,
});

/**
 * Hover with a grace period. `hitId` is what the pointer is over right now;
 * `activeId` lingers briefly after it leaves, so the pointer can travel to the
 * item's corner badge. Hovering the badge (`holdEnter`) opens its card, and a
 * click pins the card until it is closed.
 */
export const useStickyHover = (hitId: Ref<string | null>, grace = 250) => {
  const activeId = ref<string | null>(null);
  const cardOpen = ref(false);
  const pinned = ref(false);
  let held = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const release = () => {
    clearTimer();
    timer = setTimeout(() => {
      if (held || pinned.value) return;
      cardOpen.value = false;
      activeId.value = hitId.value;
    }, grace);
  };

  watch(hitId, (id) => {
    if (pinned.value || held) return;
    if (id) {
      clearTimer();
      if (id !== activeId.value) cardOpen.value = false;
      activeId.value = id;
    } else {
      release();
    }
  });

  const holdEnter = () => {
    held = true;
    clearTimer();
    cardOpen.value = true;
  };
  const holdLeave = () => {
    held = false;
    release();
  };
  const togglePin = () => {
    pinned.value = !pinned.value;
    cardOpen.value = true;
  };
  const close = () => {
    pinned.value = false;
    held = false;
    cardOpen.value = false;
    activeId.value = hitId.value;
  };
  /** Opens and pins the card for `id`, e.g. when navigating to it from elsewhere. */
  const open = (id: string) => {
    clearTimer();
    activeId.value = id;
    cardOpen.value = true;
    pinned.value = true;
  };

  onBeforeUnmount(clearTimer);

  return { activeId, cardOpen, pinned, holdEnter, holdLeave, togglePin, close, open };
};
