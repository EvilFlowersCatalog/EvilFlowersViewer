import { computed, ref } from 'vue';

// Keeps a fixed-position popup draggable by a handle and inside the viewport.
// Buttons inside the handle stay clickable: a drag never starts on them.
export const useDraggable = (popupWidth: number, margin = 12, minVisibleHeight = 48) => {
  const position = ref({ x: margin, y: margin });
  const dragging = ref(false);
  let start: { pointerX: number; pointerY: number; x: number; y: number } | null = null;

  const place = (x: number, y: number) => {
    position.value = {
      x: Math.min(Math.max(margin, x), Math.max(margin, window.innerWidth - popupWidth - margin)),
      y: Math.min(Math.max(margin, y), Math.max(margin, window.innerHeight - minVisibleHeight)),
    };
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest('button, input, textarea')) return;
    start = { pointerX: event.clientX, pointerY: event.clientY, ...position.value };
    dragging.value = true;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!start) return;
    place(start.x + event.clientX - start.pointerX, start.y + event.clientY - start.pointerY);
  };

  const onPointerUp = () => {
    start = null;
    dragging.value = false;
  };

  const style = computed(() => ({ left: `${position.value.x}px`, top: `${position.value.y}px` }));

  return {
    position,
    dragging,
    style,
    place,
    handle: {
      pointerdown: onPointerDown,
      pointermove: onPointerMove,
      pointerup: onPointerUp,
      pointercancel: onPointerUp,
    },
  };
};
