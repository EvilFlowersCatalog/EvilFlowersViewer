import { defineComponent, h, markRaw, ref } from 'vue';
import { CITATION_FORMAT, CITATION_TYPE, EDIT_TOOL } from '../utils/enums';
import pencilSvg from '@/assets/icons/pencil.svg?raw';
import highlighterSvg from '@/assets/icons/highlighter.svg?raw';
import eraserSvg from '@/assets/icons/eraser.svg?raw';
import circleSvg from '@/assets/icons/circle.svg?raw';
import lineSvg from '@/assets/icons/line.svg?raw';
import rectSvg from '@/assets/icons/rect.svg?raw';

// markRaw keeps these component definitions out of Vue's reactivity system.
// Without it, storing them in the reactive `tools` ref triggers
// "Vue received a Component that was made a reactive object" warnings.
const svgIcon = (raw: string) =>
  markRaw(
    defineComponent({
      inheritAttrs: true,
      render() {
        return h('span', {
          class: 'inline-flex items-center justify-center',
          innerHTML: raw,
        });
      },
    })
  );

// The arrow pointer ("reading" tool), drawn inline instead of pulling an icon
// pack into the bundle for one glyph.
const PointerIcon = svgIcon(
  '<svg width="1em" height="1em" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 3.2v15.6c0 .7.8 1 1.3.6l3.6-3.4 2.4 5.3c.2.5.8.7 1.3.5l1.6-.7c.5-.2.7-.8.5-1.3l-2.4-5.2h5c.7 0 1-.8.5-1.3L7.3 2.6C6.8 2.2 6 2.5 6 3.2z"/></svg>'
);
const PencilIcon = svgIcon(pencilSvg);
const HighlighterIcon = svgIcon(highlighterSvg);
const EraserIcon = svgIcon(eraserSvg);
const CircleIcon = svgIcon(circleSvg);
const LineIcon = svgIcon(lineSvg);
const RectIcon = svgIcon(rectSvg);

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
export const tools = ref<{ tool: EDIT_TOOL; icon: any }[]>([
  { tool: EDIT_TOOL.MOUSE, icon: PointerIcon },
  { tool: EDIT_TOOL.ERASER, icon: EraserIcon },
  { tool: EDIT_TOOL.PEN, icon: PencilIcon },
  { tool: EDIT_TOOL.HIGHLIGHTER, icon: HighlighterIcon },
  { tool: EDIT_TOOL.CIRCLE, icon: CircleIcon },
  { tool: EDIT_TOOL.RECT, icon: RectIcon },
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
