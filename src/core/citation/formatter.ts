// Citation formatting, loaded on first use (the Cite card). Only the parts the
// card needs are imported — the BibTeX parser, CSL (APA, Harvard, Vancouver)
// and RIS — instead of the `citation-js` meta package, which also bundles
// Wikidata, DOI and BibJSON support (~1 MB of source) the viewer never uses.
// @ts-expect-error no types are published for @citation-js/*
import { Cite } from '@citation-js/core';
import '@citation-js/plugin-bibtex';
import '@citation-js/plugin-csl';
import '@citation-js/plugin-ris';

export type CitationOutput =
  | { kind: 'csl'; template: string }
  /** `data`: CSL-JSON, which Zotero, Mendeley and most reference managers import. */
  | { kind: 'export'; format: 'bibtex' | 'biblatex' | 'ris' | 'data' };

export interface FormattedCitation {
  text: string;
  /** In-text form ("(Novak, 2021)"), for prose styles only. */
  inText: string | null;
}

/** Formats a BibTeX source in one style. Throws when the source cannot be parsed. */
export const formatCitation = (source: string, output: CitationOutput): FormattedCitation => {
  const cite = new Cite(source);
  if (output.kind === 'export') {
    const options = output.format === 'data' ? { format: 'text' } : undefined;
    return { text: String(cite.format(output.format, options)).trim(), inText: null };
  }
  const options = { format: 'text', template: output.template, lang: 'en-US' };
  return {
    text: String(cite.format('bibliography', options)).trim(),
    inText: String(cite.format('citation', options)).trim() || null,
  };
};
