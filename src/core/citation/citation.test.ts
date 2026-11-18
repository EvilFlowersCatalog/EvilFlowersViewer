import { describe, expect, it } from 'vitest';
import { decodeLatex, parseBibtex, splitAuthors } from './bibtex';
import { coinsContext, highwireTags } from './embeddedMetadata';

const ARTICLE = `@article{novak2021,
  author = {Nov{\\'a}k, J{\\'a}n and Peter Kr{\\'a}{\\v l}},
  title = {{Datab\\'azov\\'e} syst\\'emy: {SQL} v~praxi},
  journal = "Informatika",
  year = 2021,
  volume = {12}, number = {3},
  pages = {123--130},
  doi = {10.1234/abc.5},
  keywords = {databases, SQL}
}`;

describe('parseBibtex', () => {
  it('reads type, key and fields with nested braces, quotes and numbers', () => {
    const entry = parseBibtex(ARTICLE)!;
    expect(entry.type).toBe('article');
    expect(entry.key).toBe('novak2021');
    expect(entry.fields.journal).toBe('Informatika');
    expect(entry.fields.year).toBe('2021');
    expect(entry.fields.pages).toBe('123--130');
    expect(entry.fields.title).toBe('Databázové systémy: SQL v praxi');
  });

  it('returns null for no entry', () => {
    expect(parseBibtex('')).toBeNull();
    expect(parseBibtex(null)).toBeNull();
  });

  it('decodes Slovak accents', () => {
    expect(decodeLatex('Kr{\\\'a}{\\v l}, \\v{S}tefan')).toBe('Kráľ, Štefan');
  });

  it('puts the family name first', () => {
    expect(splitAuthors('Novák, Ján and Peter Kráľ')).toEqual(['Novák, Ján', 'Kráľ, Peter']);
  });
});

describe('embedded metadata', () => {
  it('builds Highwire tags for an article', () => {
    const tags = highwireTags(ARTICLE);
    const get = (name: string) => tags.filter((t) => t.name === name).map((t) => t.content);
    expect(get('citation_author')).toEqual(['Novák, Ján', 'Kráľ, Peter']);
    expect(get('citation_journal_title')).toEqual(['Informatika']);
    expect(get('citation_firstpage')).toEqual(['123']);
    expect(get('citation_lastpage')).toEqual(['130']);
    expect(get('citation_doi')).toEqual(['10.1234/abc.5']);
    expect(get('citation_keywords')).toEqual(['databases', 'SQL']);
  });

  it('builds a COinS context object', () => {
    const kev = new URLSearchParams(coinsContext(ARTICLE)!);
    expect(kev.get('rft_val_fmt')).toBe('info:ofi/fmt:kev:mtx:journal');
    expect(kev.get('rft.genre')).toBe('article');
    expect(kev.get('rft.jtitle')).toBe('Informatika');
    expect(kev.getAll('rft.au')).toEqual(['Novák, Ján', 'Kráľ, Peter']);
    expect(kev.getAll('rft_id')).toContain('info:doi/10.1234/abc.5');
    expect(kev.get('rft.pages')).toBe('123-130');
  });

  it('describes a book as a book', () => {
    const kev = new URLSearchParams(coinsContext('@book{b, title = {Základy}, publisher = {STU}, year = {2020}}')!);
    expect(kev.get('rft.genre')).toBe('book');
    expect(kev.get('rft.btitle')).toBe('Základy');
    expect(highwireTags('@book{b, title = {Základy}, publisher = {STU}}').map((t) => t.name)).toEqual([
      'citation_title',
      'citation_publisher',
    ]);
  });
});
