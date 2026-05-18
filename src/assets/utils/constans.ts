import { defineComponent, h, ref } from 'vue';
import { CITATION_FORMAT, CITATION_TYPE, EDIT_TOOL } from '../utils/enums';
import { BxSolidPointer, AkSquare } from '@kalimahapps/vue-icons';
import pencilSvg from '@/assets/icons/pencil.svg?raw';
import highlighterSvg from '@/assets/icons/highlighter.svg?raw';
import eraserSvg from '@/assets/icons/eraser.svg?raw';
import circleSvg from '@/assets/icons/circle.svg?raw';
import lineSvg from '@/assets/icons/line.svg?raw';

const svgIcon = (raw: string) =>
  defineComponent({
    inheritAttrs: true,
    render() {
      return h('span', {
        class: 'inline-flex items-center justify-center',
        innerHTML: raw,
      });
    },
  });

const PencilIcon = svgIcon(pencilSvg);
const HighlighterIcon = svgIcon(highlighterSvg);
const EraserIcon = svgIcon(eraserSvg);
const CircleIcon = svgIcon(circleSvg);
const LineIcon = svgIcon(lineSvg);

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
  { tool: EDIT_TOOL.ERASER, icon: EraserIcon },
  { tool: EDIT_TOOL.PEN, icon: PencilIcon },
  { tool: EDIT_TOOL.HIGHLIGHTER, icon: HighlighterIcon },
  { tool: EDIT_TOOL.CIRCLE, icon: CircleIcon },
  { tool: EDIT_TOOL.RECT, icon: AkSquare },
  { tool: EDIT_TOOL.LINE, icon: LineIcon },
]);
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
