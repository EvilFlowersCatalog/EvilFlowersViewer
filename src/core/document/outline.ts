// The document outline (table of contents) and named destinations.
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import type { IOutlineEntry, IPDFOutlineItem, ITOCItem } from '@/assets/utils/interfaces';

/** 1-based page of an explicit or named destination, or null. */
export const resolveDestination = async (pdf: PDFDocumentProxy, dest: unknown): Promise<number | null> => {
  if (!dest) return null;
  try {
    const explicit = typeof dest === 'string' ? await pdf.getDestination(dest) : (dest as unknown[]);
    const target = explicit?.[0];
    if (target == null) return null;
    const index = typeof target === 'number' ? target : await pdf.getPageIndex(target as never);
    return index + 1;
  } catch {
    return null;
  }
};

/**
 * The outline with each entry's page resolved. Siblings resolve in parallel
 * (one destination lookup each, possibly a Range request each when streaming).
 */
export const buildToc = async (pdf: PDFDocumentProxy, outline: IPDFOutlineItem[], level = 0): Promise<ITOCItem[]> =>
  Promise.all(
    outline.map(async (item) => {
      const [page, children] = await Promise.all([
        resolveDestination(pdf, item.dest),
        item.items?.length ? buildToc(pdf, item.items, level + 1) : Promise.resolve([]),
      ]);
      return { title: item.title ?? 'Untitled', pageNumber: page ?? -1, level, children, isExpanded: false };
    })
  );

/** Outline entries as the host sees them (no UI state). */
export const toOutline = (items: ITOCItem[]): IOutlineEntry[] =>
  items.map((item) => ({
    title: item.title,
    page: item.pageNumber > 0 ? item.pageNumber : null,
    level: item.level,
    children: toOutline(item.children),
  }));
