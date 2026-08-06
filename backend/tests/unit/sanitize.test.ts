import { describe, expect, it, vi } from 'vitest'
import { sanitizeRequest } from '../../src/middlewares/sanitize'
import type { Request, Response } from 'express'

function runSanitize(body: unknown, query: unknown = {}, params: unknown = {}) {
  const req = { body, query, params } as unknown as Request
  const next = vi.fn()
  sanitizeRequest(req, {} as Response, next)
  expect(next).toHaveBeenCalledOnce()
  return req
}

describe('sanitizeRequest', () => {
  it('strips a top-level Mongo operator key', () => {
    const req = runSanitize({ email: { $gt: '' }, password: 'x' })
    expect(req.body).toEqual({ email: {}, password: 'x' })
  })

  it('strips a nested Mongo operator key', () => {
    const req = runSanitize({ filter: { status: { $ne: 'Active' } } })
    expect(req.body).toEqual({ filter: { status: {} } })
  })

  it('strips a dot-containing key (dot-notation field injection)', () => {
    const req = runSanitize({ 'roleId.permissions': ['*'] })
    expect(req.body).toEqual({})
  })

  it('sanitizes arrays of objects', () => {
    const req = runSanitize({ items: [{ ok: 'value' }, { $where: 'evil' }] })
    expect(req.body).toEqual({ items: [{ ok: 'value' }, {}] })
  })

  it('sanitizes req.query and req.params independently of req.body', () => {
    const req = runSanitize({}, { search: { $regex: '.*' } }, { id: { $ne: null } })
    expect(req.query).toEqual({ search: {} })
    expect(req.params).toEqual({ id: {} })
  })

  it('leaves ordinary string values untouched, including dots and dollar signs in values', () => {
    const req = runSanitize({ email: 'a.b@example.com', note: 'Costs $5.00 total' })
    expect(req.body).toEqual({ email: 'a.b@example.com', note: 'Costs $5.00 total' })
  })

  it('is a no-op on primitives, null, and undefined bodies', () => {
    expect(() => runSanitize(null)).not.toThrow()
    expect(() => runSanitize(undefined)).not.toThrow()
    expect(() => runSanitize('plain string')).not.toThrow()
    expect(() => runSanitize(42)).not.toThrow()
  })
})
