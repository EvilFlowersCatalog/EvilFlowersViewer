// pdf.js resource folders the host serves (IViewerOptions.pdfAssetsUrl).
//
// pdf.js fetches `wasmUrl` and `iccUrl` inside its worker, which has no
// document base URL: a root-relative `/pdfjs/wasm/` is not a valid URL there,
// so JPEG 2000 / JBIG2 decoding and ICC colour spaces silently fail (#158).
// Every URL is therefore made absolute against the page before pdf.js sees it.

export interface PdfAssetUrls {
  wasmUrl: string;
  cMapUrl: string;
  standardFontDataUrl: string;
  iccUrl: string;
}

const pageBase = (): string | null =>
  (typeof document !== 'undefined' ? document.baseURI : globalThis.location?.href) ?? null;

/** Absolute folder URLs under `base`; `{}` without a base. `against` is the page URL. */
export const assetUrls = (
  base: string | null | undefined,
  against: string | null = pageBase()
): Partial<PdfAssetUrls> => {
  if (!base) return {};
  const slashed = base.endsWith('/') ? base : `${base}/`;
  let root = slashed;
  try {
    root = new URL(slashed, against ?? undefined).href;
  } catch {
    // No usable base (e.g. outside a browser): pass the host's value through.
  }
  return {
    wasmUrl: `${root}wasm/`,
    cMapUrl: `${root}cmaps/`,
    standardFontDataUrl: `${root}standard_fonts/`,
    iccUrl: `${root}iccs/`,
  };
};
