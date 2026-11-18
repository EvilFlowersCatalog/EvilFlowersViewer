// Pinch to zoom, the way every platform sends it:
//  · trackpad pinch in Chrome, Edge and Firefox (and Ctrl + mouse wheel):
//    `wheel` events with ctrlKey set;
//  · trackpad pinch in Safari: `gesturestart` / `gesturechange` / `gestureend`;
//  · two fingers on a touch screen: touch events.
// While the fingers move, the page column is scaled with a CSS transform
// around the point under them (instant, no re-render). When the gesture
// rests, the new zoom is committed once and the pages re-render sharp, with
// the same point kept under the fingers. The browser's own page zoom never
// kicks in, so the host page around the viewer stays as it is.
import { onBeforeUnmount, onMounted, type Ref } from 'vue';

export interface PinchCommit {
  /** Zoom factor relative to the scale at the start of the gesture. */
  factor: number;
  /** The focal point, in client coordinates. */
  clientX: number;
  clientY: number;
}

export const usePinchZoom = (
  scroller: Ref<HTMLElement | null>,
  content: Ref<HTMLElement | null>,
  options: {
    /** Current scale, and its limits, to clamp the preview. */
    scale: () => number;
    min: number;
    max: number;
    /** Whether zooming is allowed right now (e.g. the page finished rendering). */
    enabled: () => boolean;
    commit: (pinch: PinchCommit) => void;
  }
) => {
  let factor = 1;
  let focal = { clientX: 0, clientY: 0 };
  let active = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const clampFactor = (f: number) => {
    const scale = options.scale();
    return Math.min(options.max / scale, Math.max(options.min / scale, f));
  };

  // Scale the page column around the focal point, in content coordinates.
  const preview = () => {
    const el = scroller.value;
    const inner = content.value;
    if (!el || !inner) return;
    const rect = el.getBoundingClientRect();
    const originX = el.scrollLeft + focal.clientX - rect.left;
    const originY = el.scrollTop + focal.clientY - rect.top;
    inner.style.transformOrigin = `${originX}px ${originY}px`;
    inner.style.transform = `scale(${factor})`;
    inner.style.willChange = 'transform';
  };

  const clearPreview = () => {
    const inner = content.value;
    if (!inner) return;
    inner.style.transform = '';
    inner.style.transformOrigin = '';
    inner.style.willChange = '';
  };

  const begin = (clientX: number, clientY: number) => {
    if (!active) {
      active = true;
      factor = 1;
    }
    focal = { clientX, clientY };
  };

  const finish = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = null;
    if (!active) return;
    active = false;
    const done = { factor, ...focal };
    factor = 1;
    // Drop the preview and commit in the same task: the new layout and the
    // anchored scroll position are applied before the browser paints again.
    clearPreview();
    if (Math.abs(done.factor - 1) > 0.01) options.commit(done);
  };

  const finishSoon = (ms = 160) => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(finish, ms);
  };

  // ---- trackpad pinch (Chromium, Firefox) and Ctrl + wheel ----
  const onWheel = (event: WheelEvent) => {
    if (!event.ctrlKey) return; // a plain scroll
    event.preventDefault(); // keep the browser from zooming the whole page
    if (!options.enabled()) return;
    begin(event.clientX, event.clientY);
    // Trackpads send small pixel deltas, wheels large line deltas.
    const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    factor = clampFactor(factor * Math.exp(-delta * 0.01));
    preview();
    finishSoon();
  };

  // ---- trackpad pinch (Safari) ----
  let gestureStart = 1;
  const onGestureStart = (event: Event) => {
    event.preventDefault();
    if (!options.enabled()) return;
    const e = event as Event & { clientX: number; clientY: number; scale: number };
    gestureStart = factor;
    begin(e.clientX, e.clientY);
  };
  const onGestureChange = (event: Event) => {
    event.preventDefault();
    if (!active) return;
    const e = event as Event & { scale: number };
    factor = clampFactor(gestureStart * e.scale);
    preview();
  };
  const onGestureEnd = (event: Event) => {
    event.preventDefault();
    finishSoon(0);
  };

  // ---- two fingers on a touch screen ----
  let touchStartDistance = 0;
  const distance = (touches: TouchList) =>
    Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  const midpoint = (touches: TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });
  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length !== 2 || !options.enabled()) return;
    touchStartDistance = distance(event.touches);
    const mid = midpoint(event.touches);
    begin(mid.x, mid.y);
  };
  const onTouchMove = (event: TouchEvent) => {
    if (event.touches.length !== 2 || !active || !touchStartDistance) return;
    event.preventDefault();
    factor = clampFactor(distance(event.touches) / touchStartDistance);
    preview();
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (active && event.touches.length < 2) {
      touchStartDistance = 0;
      finishSoon(0);
    }
  };

  onMounted(() => {
    const el = scroller.value;
    if (!el) return;
    // Not passive: these must be able to cancel the browser's zoom.
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('gesturestart', onGestureStart, { passive: false } as AddEventListenerOptions);
    el.addEventListener('gesturechange', onGestureChange, { passive: false } as AddEventListenerOptions);
    el.addEventListener('gestureend', onGestureEnd, { passive: false } as AddEventListenerOptions);
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });
  });

  onBeforeUnmount(() => {
    if (idleTimer) clearTimeout(idleTimer);
    const el = scroller.value;
    if (!el) return;
    el.removeEventListener('wheel', onWheel);
    el.removeEventListener('gesturestart', onGestureStart);
    el.removeEventListener('gesturechange', onGestureChange);
    el.removeEventListener('gestureend', onGestureEnd);
    el.removeEventListener('touchstart', onTouchStart);
    el.removeEventListener('touchmove', onTouchMove);
    el.removeEventListener('touchend', onTouchEnd);
    el.removeEventListener('touchcancel', onTouchEnd);
  });
};
