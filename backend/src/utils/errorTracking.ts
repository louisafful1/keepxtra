/**
 * The one seam an external error tracker (Sentry, Bugsnag, Honeybadger, ...)
 * plugs into. Deliberately a no-op today — wiring in a real SDK needs a real
 * account/DSN this codebase doesn't have — but every unexpected error in the
 * app already flows through this single function (`errorHandler.ts`), so
 * adding a real integration later is a one-file change, not a hunt through
 * every controller.
 *
 * To wire in a real provider: replace the body below with e.g.
 * `Sentry.captureException(error, { extra: context })`, guarded by an env
 * var (e.g. `SENTRY_DSN`) so it stays a no-op wherever that isn't set.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}): void {
  void error
  void context
  // Intentionally empty — see the doc comment above.
}
