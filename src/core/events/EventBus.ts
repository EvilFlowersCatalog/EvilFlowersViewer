// A small typed event bus (Observer). One emission fans out to every listener:
// the host's `controller.on(...)` subscriptions, the legacy `options.on*`
// callbacks and telemetry. A throwing listener is logged and never breaks the
// viewer or the other listeners.

export type Listener<T> = (payload: T) => void;
export type Unsubscribe = () => void;

export class EventBus<Events extends { [K in keyof Events]: unknown }> {
  readonly #listeners = new Map<keyof Events, Set<Listener<never>>>();
  readonly #onError: (event: keyof Events, error: unknown) => void;

  constructor(onError?: (event: keyof Events, error: unknown) => void) {
    this.#onError =
      onError ??
      ((event, error) => console.error(`Viewer "${String(event)}" listener failed:\n`, error));
  }

  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): Unsubscribe {
    let set = this.#listeners.get(event);
    if (!set) this.#listeners.set(event, (set = new Set()));
    set.add(listener as Listener<never>);
    return () => this.off(event, listener);
  }

  once<K extends keyof Events>(event: K, listener: Listener<Events[K]>): Unsubscribe {
    const off = this.on(event, (payload) => {
      off();
      listener(payload);
    });
    return off;
  }

  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    this.#listeners.get(event)?.delete(listener as Listener<never>);
  }

  /** True when anyone listens: lets callers skip building a payload nobody reads. */
  has<K extends keyof Events>(event: K): boolean {
    return (this.#listeners.get(event)?.size ?? 0) > 0;
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.#listeners.get(event);
    if (!set?.size) return;
    // A copy: a listener may unsubscribe (once) while we iterate.
    for (const listener of [...set]) {
      try {
        (listener as Listener<Events[K]>)(payload);
      } catch (error) {
        this.#onError(event, error);
      }
    }
  }

  clear(): void {
    this.#listeners.clear();
  }
}
