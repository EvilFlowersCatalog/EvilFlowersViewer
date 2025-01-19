import { ref } from 'vue';
import { CITATION_FORMAT, CITATION_TYPE, EDIT_TOOL } from '../utils/enums';
import {
  BxSolidPencil,
  FlFilledHighlight,
  AkSquare,
  AkCircle,
  BsEraserFill,
  ClLineXl,
  BxSolidPointer,
} from '@kalimahapps/vue-icons';

export const DEFAULT_PAGE: number = 1;
export const ERROR_LINK: string = 'link-failed';
export const MAX_VISIBLE_PAGE: number = 50;
export const DESIRED_HEIGHT: number = 120;
export const DAY: number = 24;
export const KB: number = 1024;
export const MOBILE_SIZE: number = 599;
export const MIN_TOOL_SIZE: number = 2;
export const MAX_TOOL_SIZE: number = 30;
export const INTERVAL: number = 1;
export const DEFAULT_TOOL_COLOR: string = '#000000';
export const tools = ref<{ tool: EDIT_TOOL; icon: any }[]>([
  { tool: EDIT_TOOL.MOUSE, icon: BxSolidPointer },
  { tool: EDIT_TOOL.ERASER, icon: BsEraserFill },
  { tool: EDIT_TOOL.PEN, icon: BxSolidPencil },
  { tool: EDIT_TOOL.HIGHLIGHTER, icon: FlFilledHighlight },
  { tool: EDIT_TOOL.CIRCLE, icon: AkCircle },
  { tool: EDIT_TOOL.RECT, icon: AkSquare },
  { tool: EDIT_TOOL.LINE, icon: ClLineXl },
]);
export const colors = ref([
  { color: 'bg-red', value: '#ff0000' },
  { color: 'bg-orange-500', value: '#f97316' },
  { color: 'bg-yellow-500', value: '#eab308' },
  { color: 'bg-lime-500', value: '#84cc16' },
  { color: 'bg-sky-500', value: '#0ea5e9' },
  { color: 'bg-purple-500', value: '#a855f7' },
  { color: 'bg-pink-500', value: '#ec4899' },
  { color: 'bg-amber-800', value: '#92400e' },
  { color: 'bg-black', value: '#000000' },
]);
export const citations = ref<
  { name: string; type: CITATION_TYPE; format: CITATION_FORMAT }[]
>([
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
  {
    name: 'Plain-Text',
    type: CITATION_TYPE.TXT,
    format: CITATION_FORMAT.TXT,
  },
]);
