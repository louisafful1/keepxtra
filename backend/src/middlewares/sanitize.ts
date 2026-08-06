import type { NextFunction, Request, Response } from 'express'

/**
 * Strips any object key that starts with `$` or contains `.` — the two
 * building blocks of a NoSQL/Mongo query-operator injection (e.g. a login
 * payload of `{ "email": { "$gt": "" } }` trying to bypass an equality
 * check). Mutates objects/arrays **in place** rather than reassigning
 * `req.query`/`req.body`, since Express 5 made `req.query` a read-only
 * getter — a sanitizer that tries `req.query = sanitized` throws there,
 * which is exactly why this isn't just `express-mongo-sanitize`.
 *
 * Deliberately does NOT touch string *values* — only keys. Free-text
 * fields (notes, descriptions, ...) routinely contain `.`/`$` legitimately,
 * and the frontend (React) already escapes on render, so mangling stored
 * text here would risk corrupting real data for no real XSS benefit.
 */
function sanitizeInPlace(value: unknown): void {
  if (Array.isArray(value)) {
    for (const item of value) sanitizeInPlace(item)
    return
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of Object.keys(record)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete record[key]
        continue
      }
      sanitizeInPlace(record[key])
    }
  }
}

export function sanitizeRequest(req: Request, _res: Response, next: NextFunction): void {
  sanitizeInPlace(req.body)
  sanitizeInPlace(req.query)
  sanitizeInPlace(req.params)
  next()
}
