import { EventEmitter } from 'node:events'

/**
 * App-wide in-process event bus (the SAD's "events/" layer). A business
 * service emits a domain event after its own repository writes commit;
 * anything that needs to react subscribes here instead of being called
 * inline — so `StorageRequestService`, for instance, never needs to know
 * that a notification listener exists today, or that a Pickup module will
 * listen tomorrow.
 *
 * Each module defines its own `EventMap` (see `storageRequest.events.ts`)
 * and calls `createEventBus<ThatMap>()` once — `on`/`emit` are then typed
 * against it, so a listener can't subscribe to a mistyped event name or a
 * mismatched payload shape.
 */
// Intentionally `object`, not `Record<string, unknown>` — a plain interface
// with fixed literal keys (as every module's event map is) doesn't
// structurally satisfy an index-signature type in TypeScript even though
// every key *is* a string, so `Record<string, unknown>` would reject
// `StorageRequestEventMap` and everything like it.
export type EventMap = object

export interface TypedEventBus<Events extends EventMap> {
  on<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void
  /** Mirrors `on` — mainly for tests that attach a one-off listener and want to detach it afterward. */
  off<K extends keyof Events & string>(event: K, listener: (payload: Events[K]) => void): void
  emit<K extends keyof Events & string>(event: K, payload: Events[K]): void
}

export function createEventBus<Events extends EventMap>(): TypedEventBus<Events> {
  const emitter = new EventEmitter()

  return {
    on(event, listener) {
      emitter.on(event, listener as (...args: unknown[]) => void)
    },
    off(event, listener) {
      emitter.off(event, listener as (...args: unknown[]) => void)
    },
    emit(event, payload) {
      emitter.emit(event, payload)
    },
  }
}
