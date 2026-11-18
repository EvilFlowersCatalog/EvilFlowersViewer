// A polite live region for screen readers: page changes, search results and
// other state the eye sees but assistive tech would miss. One region per
// viewer; messages are debounced so scrolling through ten pages announces
// the page the reader stopped on, not all ten.
import { inject, onScopeDispose, provide, ref, type InjectionKey, type Ref } from 'vue';

export interface Announcer {
  message: Ref<string>;
  /** `delay` coalesces bursts: only the last message within it is spoken. */
  announce: (text: string, delay?: number) => void;
}

const KEY: InjectionKey<Announcer> = Symbol('efv-announcer');

export const provideAnnouncer = (): Announcer => {
  const message = ref('');
  let timer: ReturnType<typeof setTimeout> | null = null;
  const announce = (text: string, delay = 400) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      // Re-announcing the same text needs a change for the region to fire.
      message.value = message.value === text ? `${text} ` : text;
    }, delay);
  };
  onScopeDispose(() => timer && clearTimeout(timer));
  const announcer = { message, announce };
  provide(KEY, announcer);
  return announcer;
};

export const useAnnouncer = (): Announcer =>
  inject(KEY, { message: ref(''), announce: () => {} });
