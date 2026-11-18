// Describes the open publication to reference managers (Zotero, Mendeley, …)
// the way publisher sites do, from the host's BibTeX, in the formats of
// https://www.zotero.org/support/dev/exposing_metadata:
// - Highwire Press `citation_*` <meta> tags (Zotero's "Embedded Metadata"
//   translator, Mendeley's importer);
// - a COinS span (OpenURL ContextObject, Zotero's "COinS" translator).
// Pure functions; the DOM side lives in useEmbeddedMetadata.
import { parseBibtex, splitAuthors, type BibEntry } from './bibtex';

export interface MetaTag {
  name: string;
  content: string;
}

const KIND: Record<string, 'journal' | 'book' | 'chapter' | 'conference' | 'thesis' | 'report' | 'document'> = {
  article: 'journal',
  book: 'book',
  booklet: 'book',
  inbook: 'chapter',
  incollection: 'chapter',
  inproceedings: 'conference',
  conference: 'conference',
  phdthesis: 'thesis',
  mastersthesis: 'thesis',
  thesis: 'thesis',
  techreport: 'report',
  report: 'report',
};

const kindOf = (entry: BibEntry) => KIND[entry.type] ?? 'document';

/** `123--130` → [123, 130]. */
const pageRange = (pages?: string) => {
  const [first, last] = (pages ?? '').split(/\s*[-–]+\s*/);
  return { first: first || undefined, last: last || undefined };
};

/** Highwire Press tags for one BibTeX entry, in a stable order. */
export const highwireTags = (bibtex: string | null | undefined, extra: { pdfUrl?: string | null } = {}): MetaTag[] => {
  const entry = parseBibtex(bibtex);
  if (!entry) return [];
  const f = entry.fields;
  const tags: MetaTag[] = [];
  const add = (name: string, content: string | undefined) => {
    if (content) tags.push({ name, content });
  };
  const kind = kindOf(entry);
  add('citation_title', kind === 'chapter' ? f.chapter || f.title : f.title);
  splitAuthors(f.author).forEach((author) => add('citation_author', author));
  add('citation_publication_date', f.date || [f.year, f.month].filter(Boolean).join('/'));
  if (kind === 'journal') add('citation_journal_title', f.journal || f.journaltitle);
  if (kind === 'chapter') add('citation_inbook_title', f.booktitle || f.title);
  if (kind === 'conference') add('citation_conference_title', f.booktitle);
  if (kind === 'thesis') add('citation_dissertation_institution', f.school || f.institution);
  if (kind === 'report') add('citation_technical_report_institution', f.institution);
  add('citation_publisher', f.publisher);
  add('citation_volume', f.volume);
  add('citation_issue', f.number || f.issue);
  const { first, last } = pageRange(f.pages);
  add('citation_firstpage', first);
  add('citation_lastpage', last);
  add('citation_doi', f.doi);
  add('citation_isbn', f.isbn);
  add('citation_issn', f.issn);
  add('citation_language', f.language || f.langid);
  (f.keywords ?? '')
    .split(/\s*[,;]\s*/)
    .filter(Boolean)
    .forEach((keyword) => add('citation_keywords', keyword));
  add('citation_abstract', f.abstract);
  add('citation_abstract_html_url', f.url);
  add('citation_pdf_url', extra.pdfUrl ?? undefined);
  return tags;
};

/** The OpenURL ContextObject (KEV) a COinS span carries in its `title`. */
export const coinsContext = (bibtex: string | null | undefined): string | null => {
  const entry = parseBibtex(bibtex);
  if (!entry) return null;
  const f = entry.fields;
  const kind = kindOf(entry);
  const isJournal = kind === 'journal' || kind === 'conference';
  const pairs: [string, string | undefined][] = [
    ['ctx_ver', 'Z39.88-2004'],
    ['rft_val_fmt', `info:ofi/fmt:kev:mtx:${isJournal ? 'journal' : kind === 'thesis' ? 'dissertation' : 'book'}`],
    ['rft.genre', isJournal ? (kind === 'conference' ? 'proceeding' : 'article') : kind === 'chapter' ? 'bookitem' : kind === 'report' ? 'report' : kind === 'thesis' ? undefined : 'book'],
    [isJournal || kind === 'chapter' ? 'rft.atitle' : kind === 'thesis' ? 'rft.title' : 'rft.btitle', f.title],
    ['rft.jtitle', kind === 'journal' ? f.journal || f.journaltitle : undefined],
    ['rft.btitle', kind === 'chapter' || kind === 'conference' ? f.booktitle : undefined],
    ['rft.date', f.date || f.year],
    ['rft.volume', f.volume],
    ['rft.issue', f.number || f.issue],
    ['rft.pages', f.pages?.replace(/\s*[-–]+\s*/, '-')],
    ['rft.pub', f.publisher],
    ['rft.isbn', f.isbn],
    ['rft.issn', f.issn],
    ['rft_id', f.doi ? `info:doi/${f.doi}` : undefined],
    ['rft_id', f.url],
    ...splitAuthors(f.author).map((author): [string, string] => ['rft.au', author]),
  ];
  return pairs
    .filter((pair): pair is [string, string] => !!pair[1])
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
};
