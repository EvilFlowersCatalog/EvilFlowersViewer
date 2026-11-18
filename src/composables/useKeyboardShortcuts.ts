// Keyboard shortcuts of one viewer (Command pattern: a key maps to an action).
//
// Scoping (WCAG 2.1.4 "Character Key Shortcuts"): single-key shortcuts act
// only while focus is inside this viewer, or rests on the page body and this
// is the viewer the reader used last. Several viewers on one page therefore
// never react together, and a host can turn single keys off entirely.
// Modifier shortcuts (Ctrl/Cmd+F, Ctrl/Cmd ±) follow the same scope; typing
// into any text field, the host's included, never triggers anything but Esc.
import { onBeforeUnmount, onMounted, type Ref } from 'vue';

export type ShortcutAction = () => unknown;

export interface ShortcutMap {
  /** Single keys, lower-case (`f`, `arrowleft`, `+`). */
  keys: Record<string, ShortcutAction>;
  /** With Ctrl or Cmd held. */
  mod: Record<string, ShortcutAction>;
  /** With Alt held. */
  alt: Record<string, ShortcutAction>;
  /** Shift+F3 / Shift+Ctrl+G and the like: key → action receiving shift. */
  find: (backwards: boolean) => void;
  escape: ShortcutAction;
}

let lastUsed: symbol | null = null;

const isTypingTarget = (target: EventTarget | null) => {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  return el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT';
};

export const useKeyboardShortcuts = (
  root: Ref<HTMLElement | null>,
  map: () => ShortcutMap,
  mode: () => 'auto' | 'off'
) => {
  const id = Symbol('viewer');
  const markUsed = () => (lastUsed = id);

  const inScope = (event: KeyboardEvent) => {
    const el = root.value;
    const target = event.target as Node | null;
    if (el && target && el.contains(target)) return true;
    // Focus in a floating card teleported out of the root still counts.
    if (target instanceof Element && target.closest('[data-efv-float]')) return lastUsed === id;
    const idle = !target || target === document.body || target === document.documentElement;
    return idle && (lastUsed === id || lastUsed === null);
  };

  const onKeydown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const shortcuts = map();
    if (key === 'escape') {
      if (inScope(event)) shortcuts.escape();
      return;
    }
    if (isTypingTarget(event.target) || !inScope(event)) return;

    const mod = event.ctrlKey || event.metaKey;
    if (key === 'f3' || (mod && key === 'g')) {
      event.preventDefault();
      shortcuts.find(event.shiftKey);
      return;
    }
    const action = mod
      ? shortcuts.mod[key]
      : event.altKey
        ? shortcuts.alt[key]
        : mode() === 'off'
          ? undefined
          : shortcuts.keys[key];
    if (!action) return;
    event.preventDefault();
    action();
  };

  onMounted(() => {
    window.addEventListener('keydown', onKeydown);
    root.value?.addEventListener('pointerdown', markUsed, { capture: true });
    root.value?.addEventListener('focusin', markUsed);
    // The first viewer mounted is the default target until one is used.
    lastUsed ??= id;
  });
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeydown);
    root.value?.removeEventListener('pointerdown', markUsed, { capture: true });
    root.value?.removeEventListener('focusin', markUsed);
    if (lastUsed === id) lastUsed = null;
  });
};
