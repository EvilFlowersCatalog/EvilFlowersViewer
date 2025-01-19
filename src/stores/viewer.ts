import {
  CITATION_FORMAT,
  CITATION_TYPE,
  LAYER_STATE,
} from '@/assets/utils/enums';
import type { ILayer, IViewerConfig } from '@/assets/utils/interfaces';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useViewerStore = defineStore('viewer', () => {
  const citation = ref<string | null>(null);
  const basedCitation = ref<string | null>(null);
  const shareLink = ref<string>('');
  const citationType = ref<CITATION_TYPE>(CITATION_TYPE.BIB);
  const citationFormat = ref<CITATION_FORMAT>(CITATION_FORMAT.BIBTEX);
  const lang = ref<string>('en');
  const homeFunction = ref<(() => void) | null>(null);
  const closeFunction = ref<(() => void) | null>(null);
  const shareFunction = ref<
    ((pages: string | null, expaireDate: string) => Promise<string>) | null
  >(null);
  const printFunction = ref<((pages: string | null) => Promise<string>) | null>(
    null
  );
  const editPackage = ref<{
    saveGroupFunc: (name: string) => Promise<{ response: { id: string } }>;
    getGroupsFunc: () => Promise<{ id: string; name: string }[]>;
    saveLayerFunc: (
      svg: string,
      groupId: string,
      page: number
    ) => Promise<ILayer | null>;
    updateLayerFunc: (
      id: string,
      svg: string,
      groupId: string,
      page: number
    ) => Promise<void>;
    getLayerFunc: (
      page: number,
      groupId: string
    ) => Promise<ILayer | null> | null;
  } | null>(null);
  const config = ref<IViewerConfig>({
    download: false,
    share: false,
    print: false,
    edit: false,
  });

  // Setters
  const setCitation = (value: string | null) => {
    citation.value = value;
  };
  const setBasedCitation = (value: string | null) => {
    basedCitation.value = value;
  };
  const setShareLink = (value: string) => {
    shareLink.value = value;
  };
  const setLang = (value: string) => {
    lang.value = value;
  };
  const setHomeFunction = (value: (() => void) | null) => {
    homeFunction.value = value;
  };
  const setCloseFunction = (value: (() => void) | null) => {
    closeFunction.value = value;
  };
  const setShareFunction = (
    value:
      | ((pages: string | null, expaireDate: string) => Promise<string>)
      | null
  ) => {
    shareFunction.value = value;
  };
  const setPrintFunction = (
    value: ((pages: string | null) => Promise<string>) | null
  ) => {
    printFunction.value = value;
  };
  const setEditPackage = (value: typeof editPackage.value) => {
    editPackage.value = value;
  };
  const setConfig = (value: IViewerConfig) => {
    config.value = value;
  };
  const setCitationType = (value: CITATION_TYPE) => {
    citationType.value = value;
  };
  const setCitationFormat = (value: CITATION_FORMAT) => {
    citationFormat.value = value;
  };

  return {
    citation,
    basedCitation,
    shareLink,
    lang,
    homeFunction,
    closeFunction,
    shareFunction,
    editPackage,
    config,
    citationType,
    citationFormat,
    printFunction,
    setPrintFunction,
    setCitation,
    setBasedCitation,
    setShareLink,
    setLang,
    setHomeFunction,
    setCloseFunction,
    setShareFunction,
    setEditPackage,
    setConfig,
    setCitationType,
    setCitationFormat,
  };
});
