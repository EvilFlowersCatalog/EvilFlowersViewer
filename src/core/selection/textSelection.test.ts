import { describe, expect, it } from 'vitest';
import { mergeLines, normalizeSelectedText } from './textSelection';

describe('normalizeSelectedText', () => {
  it('joins words hyphenated across a line break', () => {
    expect(normalizeSelectedText('data-\nbázový systém')).toBe('databázový systém');
  });

  it('keeps a hyphen before a capital (a real compound or a name)', () => {
    expect(normalizeSelectedText('SQL-\nServer')).toBe('SQL- Server');
  });

  it('collapses whitespace and line breaks', () => {
    expect(normalizeSelectedText('  Táto kapitola\n\nsa   venuje\tSQL ')).toBe('Táto kapitola sa venuje SQL');
  });

  it('drops NUL characters and normalises ligatures', () => {
    expect(normalizeSelectedText('ef\u0000ﬁcient')).toBe('efficient');
  });
});

describe('mergeLines', () => {
  it('merges span rects on one line into a single box per line', () => {
    const lines = mergeLines([
      { left: 50, top: 10, right: 90, bottom: 22 },
      { left: 10, top: 11, right: 48, bottom: 22 },
      { left: 10, top: 30, right: 70, bottom: 42 },
    ]);
    expect(lines).toEqual([
      { left: 10, top: 10, right: 90, bottom: 22 },
      { left: 10, top: 30, right: 70, bottom: 42 },
    ]);
  });

  it('copies fields from DOMRect-like objects with getters', () => {
    class Rect {
      get left() {
        return 1;
      }
      get top() {
        return 2;
      }
      get right() {
        return 3;
      }
      get bottom() {
        return 4;
      }
    }
    expect(mergeLines([new Rect()])).toEqual([{ left: 1, top: 2, right: 3, bottom: 4 }]);
  });
});
