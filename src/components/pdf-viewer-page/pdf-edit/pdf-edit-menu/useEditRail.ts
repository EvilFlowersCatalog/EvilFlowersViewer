import { computed } from 'vue';
import { useDocumentStore, useViewerStore } from '@/stores';

/** Width of the docked drawing rail (PDFEditMenu, `w-10`). */
export const EDIT_RAIL_WIDTH = 40;

// Whether the drawing rail is docked right of the page. Things floating at the
// right edge of the content column (the recommendations chip and popup) shift
// left by its width so the rail never hides them.
export const useEditRail = () => {
  const docStore = useDocumentStore();
  const viewerStore = useViewerStore();

  const visible = computed(
    () => !!(viewerStore.config.edit && viewerStore.editPackage && !docStore.isMobile && docStore.edit)
  );
  const offset = computed(() => (visible.value ? EDIT_RAIL_WIDTH : 0));

  return { visible, offset };
};
