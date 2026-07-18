import type { TypedArray } from 'pdfjs-dist/types/src/display/api';

/** A single semantic/AI search hit returned by the host-provided function. */
export interface ISemanticSearchResult {
  /** 1-based page number the hit points to. */
  page: number;
  /** Snippet of matching text to show in the result card. */
  text: string;
  /** Optional relevance score (0..1); used only for ordering if provided. */
  score?: number;
}

export interface IViewerOptions {
  theme?: 'dark' | 'light';
  lang?: 'sk' | 'en';
  citationBib?: string | null;
  homeFunction?: (() => void) | null;
  closeFunction?: (() => void) | null;
  shareFunction?:
    | ((pages: string | null, expaireDate: string) => Promise<string>)
    | null;
  printFunction?: ((pages: string | null) => Promise<string>) | null;
  /**
   * Optional semantic/AI search. When supplied, the search panel shows a
   * second column with these results next to the client-side keyword matches.
   * When omitted, the panel stays keyword-only.
   */
  semanticSearchFunction?:
    | ((query: string) => Promise<ISemanticSearchResult[]>)
    | null;
  editPackage?: {
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
  } | null;
}

export interface IViewerProps {
  data: TypedArray;
  options?: IViewerOptions;
  config?: IViewerConfig;
}

export interface IViewerConfig {
  download?: boolean;
  share?: boolean;
  print?: boolean;
  edit?: boolean;
}

export interface IRenderViewerProps {
  rootId: string;
  data: TypedArray;
  options?: IViewerOptions | null;
  config?: IViewerConfig | null;
}

export interface IPDFMetadataProps {
  Author?: string;
  Title?: string;
  Pages?: number;
  CreationDate?: string;
  ModificationDate?: string;
  Description?: string;
  Identificator?: number;
  Creator?: string;
  Keywords?: string;
  Producer?: string;
  Subject?: string;
  Language?: string;
  PDFFormatVersion?: string;
}

export interface ITOCItem {
  isExpanded: any;
  title: string;
  pageNumber: number;
  level: number;
  children: ITOCItem[];
}

export interface IPDFOutlineItem {
  title: string;
  bold: boolean;
  italic: boolean;
  color: Uint8ClampedArray;
  dest: string | any[] | null;
  url: string | null;
  unsafeUrl: string | undefined;
  newWindow: boolean | undefined;
  count: number | undefined;
  items: IPDFOutlineItem[] | undefined;
}

export interface ILayer {
  id: string;
  svg: string;
}
