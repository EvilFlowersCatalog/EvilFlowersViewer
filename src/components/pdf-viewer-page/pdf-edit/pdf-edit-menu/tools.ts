// The drawing tools of the rail, in order, with their key (1–6 in draw mode)
// and icon. Icons are inline 20×20 strokes in currentColor.
import { EDIT_TOOL } from '@/assets/utils/enums';
import type { ShapeKind } from '@/stores/ink';

const icon = (body: string) =>
  `<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const TOOL_ICONS: Record<string, string> = {
  select: icon('<path d="M5 3.5v11.8l3-2.9 2 4.4 1.9-.8-2-4.3h4.1z" fill="currentColor" fill-opacity="0.15"/>'),
  pen: icon('<path d="M13.6 3.4l3 3L7 16l-3.6.6.6-3.6z"/><path d="M11.8 5.2l3 3"/>'),
  highlighter: icon('<path d="M11.5 3.5l5 5-6 6-5-5z" fill="currentColor" fill-opacity="0.15"/><path d="M5.5 9.5l-1.5 5 1 1 5-1.5M3 17.5h6"/>'),
  note: icon('<path d="M4 3.5h12a.5.5 0 0 1 .5.5v8.5L12.5 16.5H4a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M12.5 16.5v-3.5a.5.5 0 0 1 .5-.5h3.5M6.5 7.5h7M6.5 10.5h4"/>'),
  eraser: icon('<path d="M8 16.5l-4-4a1.4 1.4 0 0 1 0-2l6.5-6.5a1.4 1.4 0 0 1 2 0l4 4a1.4 1.4 0 0 1 0 2L10 16.5z"/><path d="M7.5 7.5l5 5M8 16.5h8.5"/>'),
  rect: icon('<rect x="3.5" y="5" width="13" height="10" rx="1.5"/>'),
  ellipse: icon('<ellipse cx="10" cy="10" rx="6.5" ry="5"/>'),
  line: icon('<path d="M4 16L16 4"/>'),
  arrow: icon('<path d="M4 16L16 4M9.5 4H16v6.5"/>'),
  hand: icon('<path d="M7 10V4.8a1.2 1.2 0 0 1 2.4 0V9m0-1V3.8a1.2 1.2 0 0 1 2.4 0V9m0-.5V5a1.2 1.2 0 0 1 2.4 0v6.5c0 3-2 5-5 5-2.3 0-3.5-1-4.6-2.8L3.3 11a1.2 1.2 0 0 1 2-1.3L7 12"/>'),
};

export interface RailTool {
  tool: EDIT_TOOL;
  label: string;
  key: string;
}

export const RAIL_TOOLS: RailTool[] = [
  { tool: EDIT_TOOL.SELECT, label: 'tool-select', key: '1' },
  { tool: EDIT_TOOL.PEN, label: 'tool-pen', key: '2' },
  { tool: EDIT_TOOL.HIGHLIGHTER, label: 'tool-highlighter', key: '3' },
  { tool: EDIT_TOOL.SHAPE, label: 'tool-shape', key: '4' },
  { tool: EDIT_TOOL.NOTE, label: 'tool-note', key: '5' },
  { tool: EDIT_TOOL.ERASER, label: 'tool-eraser', key: '6' },
];

export const SHAPES: { kind: ShapeKind; label: string }[] = [
  { kind: 'rect', label: 'tool-rectangle' },
  { kind: 'ellipse', label: 'tool-circle' },
  { kind: 'line', label: 'tool-line' },
  { kind: 'arrow', label: 'tool-arrow' },
];

/** Icon of a rail tool (the shape tool shows the shape it draws). */
export const toolIcon = (tool: EDIT_TOOL, shape: ShapeKind) => {
  switch (tool) {
    case EDIT_TOOL.SELECT:
      return TOOL_ICONS.select;
    case EDIT_TOOL.PEN:
      return TOOL_ICONS.pen;
    case EDIT_TOOL.HIGHLIGHTER:
      return TOOL_ICONS.highlighter;
    case EDIT_TOOL.SHAPE:
      return TOOL_ICONS[shape];
    case EDIT_TOOL.NOTE:
      return TOOL_ICONS.note;
    default:
      return TOOL_ICONS.eraser;
  }
};
