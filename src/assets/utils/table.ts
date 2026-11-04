// A table region's markdown as rows of cells, and those rows as CSV (IP-018 Phase 8).

const isRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const isSeparator = (line: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(line);

const splitRow = (line: string) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    // An escaped pipe stays inside its cell.
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|').replace(/<br\s*\/?>/gi, '\n'));

/** Rows of cells, the header first; null when the markdown is not a pipe table. */
export const parseMarkdownTable = (markdown: string | null | undefined): string[][] | null => {
  if (!markdown) return null;
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n').filter((line) => line.trim());
  const rows = lines.filter((line) => isRow(line) && !isSeparator(line)).map(splitRow);
  if (!rows.length) return null;
  const width = Math.max(...rows.map((row) => row.length));
  if (width < 2 && rows.length < 2) return null;
  // Short rows are padded so every column lines up.
  return rows.map((row) => [...row, ...Array(width - row.length).fill('')]);
};

const csvCell = (cell: string) => (/[",\n\r]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell);

/** RFC 4180 CSV, CRLF line ends. */
export const toCsv = (rows: string[][]): string => rows.map((row) => row.map(csvCell).join(',')).join('\r\n');

/** Tab-separated, so a paste into a spreadsheet lands in cells. */
export const toTsv = (rows: string[][]): string =>
  rows.map((row) => row.map((cell) => cell.replace(/[\t\n]/g, ' ')).join('\t')).join('\n');
