// Decorator: wraps every host function the viewer calls (semantic search,
// explain, chat, bookmarks, layers, …) so each call reports `host.call` with
// its latency and outcome. Applied once when options are bound; call sites
// stay unaware of telemetry. Only the function's name is recorded, never its
// arguments or result.
import type { Telemetry } from './Telemetry';

type AnyFn = (...args: never[]) => unknown;

/** Option keys holding packages of host functions. */
const PACKAGES = [
  'editPackage',
  'pageBookmarkPackage',
  'chatPackage',
  'regionPackage',
  'agentAnnotationPackage',
  'readerHighlightPackage',
] as const;

/** Event callbacks the viewer calls, not host services: never measured. */
const isEventCallback = (key: string) => /^on[A-Z]/.test(key) || key === 'telemetry';

const isThenable = (value: unknown): value is Promise<unknown> =>
  !!value && typeof (value as Promise<unknown>).then === 'function';

const measure = <F extends AnyFn>(telemetry: Telemetry, fn: string, call: F): F =>
  function (this: unknown, ...args: Parameters<F>) {
    if (!telemetry.enabled) return call.apply(this, args);
    const done = telemetry.start('host.call', { fn });
    try {
      const result = call.apply(this, args);
      if (isThenable(result)) {
        result.then(
          () => done({ outcome: 'ok' }),
          () => done({ outcome: 'error' }, { level: 'warn' })
        );
      } else done({ outcome: 'ok' });
      return result;
    } catch (error) {
      done({ outcome: 'error' }, { level: 'warn' });
      throw error;
    }
  } as F;

// The chat's latency that matters is time to the first streamed text.
type ChatSend = (message: string, contexts: unknown, handlers: Record<string, unknown>, meta: unknown) => unknown;
const measureChat = (telemetry: Telemetry, send: ChatSend): ChatSend =>
  function (this: unknown, message, contexts, handlers, meta) {
    if (!telemetry.enabled || !handlers) return send.call(this, message, contexts, handlers, meta);
    const firstToken = telemetry.start('chat.first_token');
    let seen = false;
    const onFirst = <H extends (...a: never[]) => unknown>(handler: H | undefined) =>
      handler &&
      ((...a: Parameters<H>) => {
        if (!seen) {
          seen = true;
          firstToken();
        }
        return handler(...a);
      });
    const wrapped = {
      ...handlers,
      onChunk: onFirst(handlers.onChunk as AnyFn | undefined),
      onMessage: onFirst(handlers.onMessage as AnyFn | undefined),
    };
    return send.call(this, message, contexts, wrapped, meta);
  };

const wrapPackage = <P extends object>(telemetry: Telemetry, name: string, pkg: P): P => {
  const out = { ...pkg } as Record<string, unknown>;
  for (const [key, value] of Object.entries(pkg)) {
    if (typeof value !== 'function') continue;
    const fn = name === 'chatPackage' && key === 'sendMessageFunc' ? measureChat(telemetry, value as ChatSend) : value;
    out[key] = measure(telemetry, `${name}.${key}`, fn as AnyFn);
  }
  return out as P;
};

/** A copy of `options` whose host functions report `host.call`. */
export const instrumentHost = <O extends object>(telemetry: Telemetry, options: O): O => {
  const out = { ...options } as Record<string, unknown>;
  for (const [key, value] of Object.entries(options)) {
    if (isEventCallback(key) || value == null) continue;
    if (typeof value === 'function') out[key] = measure(telemetry, key, value as AnyFn);
    else if ((PACKAGES as readonly string[]).includes(key) && typeof value === 'object')
      out[key] = wrapPackage(telemetry, key, value);
  }
  return out as O;
};
