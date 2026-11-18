// Page selections typed by the reader ("1, 4-7, 10") for Share and Print.

/** What part of the document an action covers. */
export type PageScope = 'document' | 'page' | 'pages';

const RANGE = /^\s*\d+(\s*-\s*\d+)?(\s*,\s*\d+(\s*-\s*\d+)?)*\s*$/;

/** True for "3", "1-4", "1, 4-7, 10" (whitespace ignored). */
export const isPageRange = (value: string): boolean => RANGE.test(value);

/**
 * The host's `pages` argument for a scope: null for the whole document, the
 * current page, or the typed range without whitespace.
 */
export const pagesForScope = (scope: PageScope, activePage: number, typed: string): string | null =>
  scope === 'document' ? null : scope === 'page' ? String(activePage) : typed.replace(/\s+/g, '');
