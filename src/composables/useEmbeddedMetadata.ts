// Puts the open publication's citation metadata where reference managers
// look for it: Highwire `citation_*` <meta> tags in the document head and a
// COinS span inside the viewer. The tags are marked `data-efv-citation` and
// removed on unmount or when the citation changes; tags the host page already
// has are left alone (the viewer adds none then). `options.citationMetadata:
// false` turns this off for hosts that publish their own.
import { computed, onScopeDispose, watch, type Ref } from 'vue';
import { coinsContext, highwireTags } from '@/core/citation/embeddedMetadata';

const MARK = 'data-efv-citation';

export const useEmbeddedMetadata = (bibtex: Ref<string | null>, enabled: () => boolean) => {
  const coins = computed(() => (enabled() ? coinsContext(bibtex.value) : null));

  let added: HTMLMetaElement[] = [];
  const clear = () => {
    added.forEach((el) => el.remove());
    added = [];
  };
  const apply = () => {
    clear();
    if (!enabled() || typeof document === 'undefined') return;
    // A host that describes the publication itself wins.
    if (document.head.querySelector(`meta[name="citation_title"]:not([${MARK}])`)) return;
    added = highwireTags(bibtex.value).map(({ name, content }) => {
      const el = document.createElement('meta');
      el.name = name;
      el.content = content;
      el.setAttribute(MARK, '');
      document.head.append(el);
      return el;
    });
    // Zotero re-detects on DOM changes in single-page apps.
    if (added.length) document.dispatchEvent(new Event('ZoteroItemUpdated', { bubbles: true, cancelable: true }));
  };

  watch(bibtex, apply, { immediate: true });
  onScopeDispose(clear);

  return { coins };
};
