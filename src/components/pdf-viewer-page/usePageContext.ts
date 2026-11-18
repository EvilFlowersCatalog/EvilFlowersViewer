// Which page a layer belongs to. With continuous scroll several pages are on
// screen at once, so a layer (highlights, regions, focus, search hits,
// selection) must draw for *its* page, not for the store's active page.
// PageView provides the context; without one (a layer used outside a page)
// it falls back to the active page and the global render state.
import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue';
import { useDocumentStore } from '@/stores';
import { RENDER_STATE } from '@/assets/utils/enums';

export interface PageContext {
  /** 1-based page number this layer draws for. */
  page: ComputedRef<number>;
  /** True once this page's bitmap is painted (layers may measure it). */
  rendered: ComputedRef<boolean>;
}

const KEY: InjectionKey<PageContext> = Symbol('efv-page-context');

export const providePageContext = (context: PageContext) => provide(KEY, context);

export const usePageContext = (): PageContext => {
  const provided = inject(KEY, null);
  if (provided) return provided;
  const docStore = useDocumentStore();
  return {
    page: computed(() => docStore.activePage),
    rendered: computed(() => docStore.renderState === RENDER_STATE.RENDERED),
  };
};
