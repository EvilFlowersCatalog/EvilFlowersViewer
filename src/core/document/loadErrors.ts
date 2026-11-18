// Classifies why a document (or a page of it) failed, from what pdf.js and our
// range transport throw. Pure: no Vue, no stores.
import type { IDocumentErrorInfo, LOAD_ERROR_REASON } from '@/assets/utils/interfaces';

type ErrorShape = { name?: string; message?: string; details?: string; status?: number };

const shape = (error: unknown): ErrorShape => (error ?? {}) as ErrorShape;

const httpStatusOf = (error: unknown): number | null => {
  const { status } = shape(error);
  return typeof status === 'number' && status > 0 ? status : null;
};

/** A failed fetch reaches us as a TypeError, or wrapped by the pdf.js worker. */
const looksLikeNetworkFailure = ({ name, message, details }: ErrorShape) =>
  (name === 'TypeError' || name === 'UnknownErrorException') &&
  /fetch|network|load failed/i.test(`${message ?? ''} ${details ?? ''}`);

export const describeLoadError = (error: unknown): { reason: LOAD_ERROR_REASON; status: number | null } => {
  const err = shape(error);
  const status = httpStatusOf(error);
  if (err.name === 'PasswordException') return { reason: 'load-error-password', status: null };
  if (err.name === 'InvalidPDFException') return { reason: 'load-error-invalid', status: null };
  if (err.name === 'ResponseException' || err.name === 'HttpStatusError') {
    if (status === 401 || status === 403) return { reason: 'load-error-auth', status };
    if (status === 404 || status === 410) return { reason: 'load-error-not-found', status };
    return { reason: 'load-error-network', status };
  }
  if (looksLikeNetworkFailure(err)) return { reason: 'load-error-network', status: null };
  return { reason: 'load-error-unknown', status: null };
};

/** The stage a load failure is reported under. */
export const failureStage = (reason: LOAD_ERROR_REASON, hadSource: boolean): IDocumentErrorInfo['stage'] =>
  reason === 'load-error-network' || reason === 'load-error-auth' || reason === 'load-error-not-found' || !hadSource
    ? 'download'
    : 'parse';

/**
 * A page whose bytes could not be fetched after the document opened (network
 * drop, expired signed URL). Anything else thrown while rendering is a bug.
 */
export const isPageFetchFailure = (error: unknown): { status: number | null } | null => {
  const { name, message, details } = shape(error);
  const failed =
    name === 'ResponseException' ||
    /fetch|network|load failed|unexpected server response/i.test(`${message ?? ''} ${details ?? ''}`);
  return failed ? { status: httpStatusOf(error) } : null;
};
