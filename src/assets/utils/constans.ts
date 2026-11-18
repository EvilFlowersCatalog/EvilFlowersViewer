import { ref } from 'vue';
import { CITATION_FORMAT, CITATION_TYPE } from '../utils/enums';

export const DEFAULT_PAGE: number = 1;
export const ERROR_LINK: string = 'link-failed';
export const MAX_VISIBLE_PAGE: number = 50;
export const DESIRED_HEIGHT: number = 120;
export const DAY: number = 24;
export const KB: number = 1024;
export const MOBILE_SIZE: number = 599;
export const MIN_TOOL_SIZE: number = 2;
export const MAX_TOOL_SIZE: number = 30;
export const MIN_SCALE: number = 0.25;
export const MAX_SCALE: number = 4;
export const SCALE_STEP: number = 0.25;
export const INTERVAL: number = 1;
export const DEFAULT_TOOL_COLOR: string = '#000000';
export const DEFAULT_HIGHLIGHT_COLOR: string = '#ffe100';
export const colors = ref([
  { color: '', value: '#f02727' },
  { color: '', value: '#ff7f00' },
  { color: '', value: '#ffe100' },
  { color: '', value: '#36f82c' },
  { color: '', value: '#50aaff' },
  { color: '', value: '#c64aff' },
  { color: '', value: '#ff61ef' },
  { color: '', value: '#ba6300' },
  { color: '', value: '#1d1d1d' },
]);
export const citations = ref<
  { name: string; type: CITATION_TYPE; format: CITATION_FORMAT }[]
>([
  {
    name: 'Plain Text',
    type: CITATION_TYPE.TXT,
    format: CITATION_FORMAT.TXT,
  },
  {
    name: 'BibTeX',
    type: CITATION_TYPE.BIB,
    format: CITATION_FORMAT.BIBTEX,
  },
  {
    name: 'BibLaTeX',
    type: CITATION_TYPE.BIB,
    format: CITATION_FORMAT.BIBLATEX,
  },
  {
    name: 'RIS',
    type: CITATION_TYPE.RIS,
    format: CITATION_FORMAT.RIS,
  },
]);
