import DOMPurify from 'dompurify';

// A small markdown renderer for assistant answers: paragraphs, headings, lists,
// GFM tables, bold/italic/code, plus the viewer's citation tokens
// `[[page:N]]` and `[[region:ID]]`, which become buttons with data attributes.
// Output is sanitized, so answer text can never inject markup.

const escapeHtml = (text: string) =>
  text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface ICitationLabels {
  page: (page: string) => string;
  region: (id: string) => string;
  /**
   * Chip of an evidence label (`E3`, `F2`), or null to leave it as text. An
   * `inert` chip is shown but cannot be clicked. Without it labels are not touched.
   */
  evidence?: (label: string) => { text: string; inert?: boolean } | null;
}

// Evidence labels as the model writes them: `[E3]`, `[E3, F2]`, `[E3; E5]`; `[E3][E5]` is two groups.
const EVIDENCE_GROUP = /\[\s*([EF]\d+(?:\s*[,;]\s*[EF]\d+)*)\s*\]/gi;

/** `e03` → `E3`. */
export const normalizeEvidenceLabel = (raw: string): string => `${raw.charAt(0).toUpperCase()}${Number(raw.slice(1))}`;

const evidenceChips = (html: string, evidence: NonNullable<ICitationLabels['evidence']>) =>
  html.replace(EVIDENCE_GROUP, (group, list: string) => {
    const chips = list
      .split(/\s*[,;]\s*/)
      .map(normalizeEvidenceLabel)
      .map((label) => ({ label, chip: evidence(label) }));
    // A group none of whose labels resolve stays as the model wrote it.
    if (chips.every(({ chip }) => chip === null)) return group;
    return chips
      .map(({ label, chip }) =>
        chip === null
          ? `[${label}]`
          : `<button type="button" class="efv-cite" data-evidence="${label}"${chip.inert ? ' aria-disabled="true"' : ''}>${escapeHtml(chip.text)}</button>`
      )
      .join('');
  });

/**
 * Citation tokens as the model actually writes them, made canonical: `[[page:7], [page:13]]`,
 * `[page:7]` and `[[page:7, 13]]` all become one `[[page:N]]` per page (same for regions).
 */
export const normalizeCitations = (text: string): string =>
  text
    .replace(/\[+\s*page:\s*(\d+(?:\s*,\s*(?:page:\s*)?\d+)+)\s*\]+/g, (_, list: string) =>
      list
        .split(',')
        .map((page) => `[[page:${page.replace(/\D/g, '')}]]`)
        .join(', ')
    )
    .replace(/\[+\s*(page|region):\s*([\w-]+)\s*\]+/g, '[[$1:$2]]');

const inline = (text: string, labels: ICitationLabels) => {
  const html = inlineMarkup(text, labels);
  return labels.evidence ? evidenceChips(html, labels.evidence) : html;
};

const inlineMarkup = (text: string, labels: ICitationLabels) =>
  escapeHtml(normalizeCitations(text))
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(
      /\[\[page:(\d+)\]\]/g,
      (_, page) => `<button type="button" class="efv-cite" data-page="${page}">${escapeHtml(labels.page(page))}</button>`
    )
    .replace(
      /\[\[region:([\w-]+)\]\]/g,
      (_, id) => `<button type="button" class="efv-cite" data-region="${id}">${escapeHtml(labels.region(id))}</button>`
    );

const isTableRow = (line: string) => /^\s*\|.*\|\s*$/.test(line);
const cells = (line: string) =>
  line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim());

export const renderMarkdown = (source: string, labels: ICitationLabels): string => {
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const html: string[] = [];
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length) html.push(`<p>${paragraph.map((l) => inline(l, labels)).join('<br>')}</p>`);
    paragraph = [];
  };
  const flushList = () => {
    if (!list) return;
    const tag = list.ordered ? 'ol' : 'ul';
    html.push(`<${tag}>${list.items.map((i) => `<li>${inline(i, labels)}</li>`).join('')}</${tag}>`);
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    // GFM table: header row, separator row, body rows.
    if (isTableRow(line) && lines[i + 1] && /^\s*\|?[\s:-]+\|[\s|:-]*$/.test(lines[i + 1])) {
      flushParagraph();
      flushList();
      const head = cells(line);
      const body: string[][] = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) body.push(cells(lines[i++]));
      i--;
      html.push(
        `<table><thead><tr>${head.map((c) => `<th>${inline(c, labels)}</th>`).join('')}</tr></thead><tbody>${body
          .map((row) => `<tr>${row.map((c) => `<td>${inline(c, labels)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`
      );
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      flushList();
      html.push(`<h4>${inline(heading[2], labels)}</h4>`);
      continue;
    }

    const item = /^\s*(?:([-*])|(\d+)[.)])\s+(.*)$/.exec(line);
    if (item) {
      flushParagraph();
      const ordered = !!item[2];
      if (list && list.ordered !== ordered) flushList();
      list ??= { ordered, items: [] };
      list.items.push(item[3]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }
  flushParagraph();
  flushList();

  return DOMPurify.sanitize(html.join(''));
};
