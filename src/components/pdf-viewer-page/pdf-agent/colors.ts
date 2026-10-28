// One colour per agent annotation, cycled. Kept apart from the reader's own
// highlighter colours so agent marks are recognisable.
const PALETTE: [number, number, number][] = [
  [124, 58, 237], // violet
  [13, 148, 136], // teal
  [234, 88, 12], // orange
  [219, 39, 119], // pink
  [37, 99, 235], // blue
];

export const highlightColor = (index: number, alpha: number) => {
  const [r, g, b] = PALETTE[index % PALETTE.length];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
