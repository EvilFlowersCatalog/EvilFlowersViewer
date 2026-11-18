// One TextSelectionController per viewer, shared by every page through
// provide/inject. Its state is a shallow ref the pages read to show the
// selection menu on the page the selection starts on.
import { inject, onScopeDispose, provide, shallowRef, type InjectionKey, type ShallowRef } from 'vue';
import { TextSelectionController, type SelectionState } from '@/core/selection/textSelection';
import { useViewerStore } from '@/stores';

export interface TextSelection {
  state: ShallowRef<SelectionState>;
  register: (layer: HTMLElement) => () => void;
  clear: () => void;
}

const KEY: InjectionKey<TextSelection> = Symbol('efv-text-selection');

export const provideTextSelection = (): TextSelection => {
  const viewerStore = useViewerStore();
  const state = shallowRef<SelectionState>({ kind: 'none' });
  let published: string | null = null;
  const controller = new TextSelectionController((next) => {
    state.value = next;
    // The host hears about finished selections and their removal only.
    if (next.kind === 'selected') {
      published = next.selection.text;
      viewerStore.events.emit('selection-change', next.selection);
    } else if (next.kind === 'none' && published !== null) {
      published = null;
      viewerStore.events.emit('selection-change', null);
    }
  });
  onScopeDispose(() => controller.dispose());
  const api: TextSelection = {
    state,
    register: (layer) => controller.register(layer),
    clear: () => controller.clear(),
  };
  provide(KEY, api);
  return api;
};

export const useTextSelection = (): TextSelection | null => inject(KEY, null);
