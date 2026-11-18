import { onBeforeUnmount, ref, watch, type Ref } from 'vue';
import type { IPageBox } from '@/assets/utils/interfaces';
import { useTextSelection } from '@/composables/useTextSelection';

/**
 * Pointer position over the page body as page fractions (top-left origin), or
 * null when the pointer is elsewhere. Layers hit-test against this instead of
 * catching pointer events themselves, so text selection keeps working under
 * figures and highlights. While the reader selects text (or has a selection
 * with its menu open) the pointer counts as absent: figure and highlight
 * cards must not flicker under a drag.
 */
export const usePagePointer = (pageBodyRef: Ref<HTMLElement | null>) => {
  const point = ref<{ x: number; y: number } | null>(null);
  const selection = useTextSelection();
  let element: HTMLElement | null = null;

  if (selection)
    watch(
      () => selection.state.value.kind,
      (kind) => {
        if (kind !== 'none') point.value = null;
      }
    );

  const onMove = (event: MouseEvent) => {
    if (!element) return;
    if (selection && selection.state.value.kind !== 'none') return;
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
 * Scrolls the page scroller (never the host page) so `box` is in view:
 * centred when it fits, else its top-left corner with a margin. `ifNeeded`
 * leaves the scroll alone when the box is already fully visible.
 */
export const scrollPageToBox = (
  pageBody: HTMLElement | null,
  box: IPageBox,
  { ifNeeded = false }: { ifNeeded?: boolean } = {}
) => {
  const scroller = pageBody?.closest<HTMLElement>('[data-page-scroll]');
  if (!pageBody || !scroller) return;
  const page = pageBody.getBoundingClientRect();
  const view = scroller.getBoundingClientRect();
  if (!page.width || !page.height) return;

  const margin = 24;
  const top = page.top - view.top + scroller.scrollTop + box.y0 * page.height;
  const height = (box.y1 - box.y0) * page.height;
  const left = page.left - view.left + scroller.scrollLeft + box.x0 * page.width;
  const width = (box.x1 - box.x0) * page.width;

  if (ifNeeded) {
    const visible =
      top >= scroller.scrollTop + margin &&
      top + height <= scroller.scrollTop + scroller.clientHeight - margin &&
      left >= scroller.scrollLeft &&
      left + width <= scroller.scrollLeft + scroller.clientWidth;
    if (visible) return;
  }

  const center = (start: number, size: number, viewSize: number) =>
    size + 2 * margin > viewSize ? start - margin : start + size / 2 - viewSize / 2;

  scroller.scrollTo({
    top: Math.max(0, center(top, height, scroller.clientHeight)),
    left: Math.max(0, center(left, width, scroller.clientWidth)),
    behavior: 'smooth',
  });
};

/** `box` (page fractions) in viewport pixels, for cards placed beside it. */
export const boxToViewport = (pageBody: HTMLElement | null, box: IPageBox) => {
  if (!pageBody) return null;
  const rect = pageBody.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    left: rect.left + box.x0 * rect.width,
    top: rect.top + box.y0 * rect.height,
    right: rect.left + box.x1 * rect.width,
    bottom: rect.top + box.y1 * rect.height,
  };
};

/** The visible part of the page scroller (scrollbars excluded): where page cards may go. */
export const pageViewport = (pageBody: HTMLElement | null) => {
  const scroller = pageBody?.closest<HTMLElement>('[data-page-scroll]');
  if (!scroller) return null;
  const rect = scroller.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    right: rect.left + scroller.clientWidth,
    bottom: rect.top + scroller.clientHeight,
  };
};

// Only one page card (figure, table, highlight) is open at a time, across layers.
const openCardOwner = ref<symbol | null>(null);

/**
 * Hover with a grace period. `hitId` is what the pointer is over right now;
 * `activeId` lingers briefly after it leaves, so the pointer can travel to the
 * item's corner badge. Hovering the badge (`holdEnter`) opens its card, and a
 * click pins the card until it is closed. An open card stays while the pointer
 * is over its item, so the pointer can cross the item to reach the card.
 */
export const useStickyHover = (hitId: Ref<string | null>, grace = 250) => {
  const activeId = ref<string | null>(null);
  const cardOpen = ref(false);
  const pinned = ref(false);
  const owner = Symbol('page-card');
  let held = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  watch(cardOpen, (open) => {
    if (open) openCardOwner.value = owner;
    else if (openCardOwner.value === owner) openCardOwner.value = null;
  });

  const clearTimer = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const release = () => {
    clearTimer();
    timer = setTimeout(() => {
      if (held || pinned.value) return;
      if (cardOpen.value && hitId.value === activeId.value) return;
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
  const pin = () => {
    pinned.value = true;
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

  // Another layer opened its card: this one gives way.
  watch(openCardOwner, (current) => {
    if (current && current !== owner && cardOpen.value) close();
  });

  onBeforeUnmount(() => {
    clearTimer();
    if (openCardOwner.value === owner) openCardOwner.value = null;
  });

  return { activeId, cardOpen, pinned, holdEnter, holdLeave, togglePin, pin, close, open };
};
