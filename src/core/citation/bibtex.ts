// A small BibTeX reader for one entry: its type and fields, enough to describe
// the publication to reference managers without loading citation-js (which
// stays a lazy chunk for the Cite card). Handles `{…}` with nesting, `"…"`,
// bare numbers, LaTeX accents of the common forms and `and`-joined authors.

export interface BibEntry {
  type: string;
  key: string;
  fields: Record<string, string>;
}

const ACCENTS: Record<string, Record<string, string>> = {
  "'": { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', y: 'ý', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú', Y: 'Ý', l: 'ĺ', r: 'ŕ', L: 'Ĺ', R: 'Ŕ', n: 'ń', c: 'ć', s: 'ś', z: 'ź' },
  v: { c: 'č', d: 'ď', e: 'ě', l: 'ľ', n: 'ň', r: 'ř', s: 'š', t: 'ť', z: 'ž', C: 'Č', D: 'Ď', E: 'Ě', L: 'Ľ', N: 'Ň', R: 'Ř', S: 'Š', T: 'Ť', Z: 'Ž' },
  '"': { a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü', e: 'ë', i: 'ï' },
  '^': { o: 'ô', a: 'â', e: 'ê', i: 'î', u: 'û', O: 'Ô' },
  '`': { a: 'à', e: 'è', i: 'ì', o: 'ò', u: 'ù' },
  '~': { n: 'ñ', a: 'ã', o: 'õ', N: 'Ñ' },
};

/** LaTeX accents (`\v{c}`, `{\'a}`, `\"o`) to Unicode; remaining braces dropped. */
export const decodeLatex = (value: string): string =>
  value
    .replace(/\{?\\([`'^"~v])\s*\{?([A-Za-z])\}?\}?/g, (match, accent: string, letter: string) => ACCENTS[accent]?.[letter] ?? match)
    .replace(/\\&/g, '&')
    .replace(/(^|[^\\])~/g, '$1 ') // a bare tilde is a non-breaking space
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Reads the value starting at `i` (after `=`); returns it and the index after it. */
const readValue = (src: string, i: number): [string, number] => {
  while (/\s/.test(src[i] ?? '')) i++;
  const open = src[i];
  if (open === '{' || open === '"') {
    // `{…}` ends at its matching brace; `"…"` at a quote outside braces.
    let depth = open === '{' ? 1 : 0;
    let j = i + 1;
    for (; j < src.length; j++) {
      const ch = src[j];
      if (ch === '\\') {
        j++;
        continue;
      }
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (open === '{' && depth === 0) break;
      } else if (ch === '"' && open === '"' && depth === 0) break;
    }
    return [src.slice(i + 1, j), j + 1];
  }
  const match = /^[^,}\s]+/.exec(src.slice(i));
  return [match?.[0] ?? '', i + (match?.[0].length ?? 0)];
};

/** The first entry of a BibTeX string, or null when there is none. */
export const parseBibtex = (source: string | null | undefined): BibEntry | null => {
  const head = /@\s*(\w+)\s*\{\s*([^,\s]*)\s*,/.exec(source ?? '');
  if (!source || !head) return null;
  const fields: Record<string, string> = {};
  let i = head.index + head[0].length;
  const field = /\s*([A-Za-z][\w-]*)\s*=/y;
  while (i < source.length) {
    field.lastIndex = i;
    const name = field.exec(source);
    if (!name) break;
    const [value, next] = readValue(source, field.lastIndex);
    fields[name[1].toLowerCase()] = decodeLatex(value);
    i = next;
    while (i < source.length && /[\s,]/.test(source[i])) i++;
    if (source[i] === '}') break;
  }
  return { type: head[1].toLowerCase(), key: head[2], fields };
};

/** `Novák, Ján and Peter Kráľ` → `['Novák, Ján', 'Kráľ, Peter']` (family name first). */
export const splitAuthors = (value: string | undefined): string[] =>
  (value ?? '')
    .split(/\s+and\s+/i)
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => {
      if (name.includes(',')) return name;
      const parts = name.split(/\s+/);
      return parts.length > 1 ? `${parts[parts.length - 1]}, ${parts.slice(0, -1).join(' ')}` : name;
    });
