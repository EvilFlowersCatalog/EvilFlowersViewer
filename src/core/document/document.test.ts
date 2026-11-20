import { describe, expect, it } from 'vitest';
import { describeLoadError, failureStage, isPageFetchFailure } from './loadErrors';
import { isPageRange, pagesForScope } from './pageRange';
import { toOutline } from './outline';
import { assetUrls } from './assetUrls';

describe('assetUrls (#158)', () => {
  const page = 'https://dev.elvira.stuba.sk/entries/40c6/read?page=77';

  it('resolves a root-relative base against the page, so the worker can fetch it', () => {
    expect(assetUrls('/pdfjs/', page)).toEqual({
      wasmUrl: 'https://dev.elvira.stuba.sk/pdfjs/wasm/',
      cMapUrl: 'https://dev.elvira.stuba.sk/pdfjs/cmaps/',
      standardFontDataUrl: 'https://dev.elvira.stuba.sk/pdfjs/standard_fonts/',
      iccUrl: 'https://dev.elvira.stuba.sk/pdfjs/iccs/',
    });
  });

  it('adds the trailing slash and resolves document-relative paths', () => {
    expect(assetUrls('pdfjs', page).wasmUrl).toBe('https://dev.elvira.stuba.sk/entries/40c6/pdfjs/wasm/');
  });

  it('keeps absolute bases', () => {
    expect(assetUrls('https://cdn.example.org/pdfjs', page).iccUrl).toBe('https://cdn.example.org/pdfjs/iccs/');
  });

  it('passes the value through without a usable page base, and is empty without a base', () => {
    expect(assetUrls('/pdfjs/', null).wasmUrl).toBe('/pdfjs/wasm/');
    expect(assetUrls(null, page)).toEqual({});
  });
});

describe('describeLoadError', () => {
  it.each([
    [{ name: 'PasswordException' }, 'load-error-password', null],
    [{ name: 'InvalidPDFException' }, 'load-error-invalid', null],
    [{ name: 'ResponseException', status: 401 }, 'load-error-auth', 401],
    [{ name: 'HttpStatusError', status: 403 }, 'load-error-auth', 403],
    [{ name: 'ResponseException', status: 404 }, 'load-error-not-found', 404],
    [{ name: 'ResponseException', status: 410 }, 'load-error-not-found', 410],
    [{ name: 'ResponseException', status: 500 }, 'load-error-network', 500],
    [{ name: 'TypeError', message: 'Failed to fetch' }, 'load-error-network', null],
    [{ name: 'UnknownErrorException', details: 'NetworkError when attempting' }, 'load-error-network', null],
    [{ name: 'Error', message: 'boom' }, 'load-error-unknown', null],
    [null, 'load-error-unknown', null],
  ])('%o → %s', (error, reason, status) => {
    expect(describeLoadError(error)).toEqual({ reason, status });
  });

  it('reports fetch failures as download, the rest as parse', () => {
    expect(failureStage('load-error-auth', true)).toBe('download');
    expect(failureStage('load-error-invalid', true)).toBe('parse');
    expect(failureStage('load-error-unknown', false)).toBe('download');
  });

  it('recognises a page fetch failure', () => {
    expect(isPageFetchFailure({ name: 'ResponseException', status: 403 })).toEqual({ status: 403 });
    expect(isPageFetchFailure({ name: 'Error', message: 'Unexpected server response (0)' })).toEqual({ status: null });
    expect(isPageFetchFailure(new Error('canvas lost'))).toBeNull();
  });
});

describe('page ranges', () => {
  it.each([
    ['3', true],
    ['1-4', true],
    ['1, 4-7, 10', true],
    ['', false],
    ['1-', false],
    ['a', false],
  ])('%s valid: %s', (value, valid) => expect(isPageRange(value)).toBe(valid));

  it('maps a scope to the host argument', () => {
    expect(pagesForScope('document', 5, '')).toBeNull();
    expect(pagesForScope('page', 5, '')).toBe('5');
    expect(pagesForScope('pages', 5, ' 1, 4 - 7 ')).toBe('1,4-7');
  });
});

describe('toOutline', () => {
  it('drops UI state and unresolved pages', () => {
    expect(
      toOutline([
        {
          title: 'A',
          pageNumber: 3,
          level: 0,
          isExpanded: true,
          children: [{ title: 'A.1', pageNumber: -1, level: 1, isExpanded: false, children: [] }],
        },
      ])
    ).toEqual([{ title: 'A', page: 3, level: 0, children: [{ title: 'A.1', page: null, level: 1, children: [] }] }]);
  });
});
