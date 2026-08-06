import { describe, expect, it } from 'vitest'
import SwaggerParser from '@apidevtools/swagger-parser'
import { swaggerSpec as rawSwaggerSpec } from '../../src/config/swagger'
import type { OpenAPIV3 } from 'openapi-types'

// swagger-jsdoc's return type is just `object` — this is the real shape of what it builds from `config/swagger.ts`'s own OpenAPI-3 `swaggerDefinition`.
const swaggerSpec = rawSwaggerSpec as OpenAPIV3.Document

/**
 * Validates the generated OpenAPI document itself is well-formed and
 * internally consistent (every `$ref` resolves, every schema is valid
 * against the OpenAPI 3 meta-schema) — the "API contract" the Swagger UI
 * and any generated client rely on. This is the one test in the suite that
 * exercises `config/swagger.ts`'s *output* directly, independent of any
 * single endpoint's behavior.
 */
describe('OpenAPI contract', () => {
  it('is a valid, fully-resolvable OpenAPI 3 document', async () => {
    // Throws on any structural problem — the assertion is that this doesn't throw.
    const api = await SwaggerParser.validate(structuredClone(swaggerSpec))
    expect((api as unknown as OpenAPIV3.Document).openapi).toMatch(/^3\./)
  })

  it('documents every mounted module', () => {
    const paths = Object.keys(swaggerSpec.paths ?? {})
    const modules = ['/auth', '/farmers', '/storage-requests', '/pickups', '/warehouses', '/inventory', '/orders', '/payouts', '/notifications', '/reports']

    for (const module of modules) {
      expect(paths.some((path) => path.startsWith(module))).toBe(true)
    }
  })

  it('gives every operation a summary and at least one documented response', () => {
    const paths = swaggerSpec.paths ?? {}

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(methods as Record<string, OpenAPIV3.OperationObject>)) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue
        expect(operation.summary, `${method.toUpperCase()} ${path} is missing a summary`).toBeTruthy()
        expect(Object.keys(operation.responses ?? {}).length, `${method.toUpperCase()} ${path} documents no responses`).toBeGreaterThan(0)
      }
    }
  })

  it('every operation requiring auth declares bearerAuth security', () => {
    const paths = swaggerSpec.paths ?? {}
    const publicPaths = [
      '/auth/login',
      '/auth/register',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/verify-email',
      '/auth/resend-verification',
      // Operates purely on the refresh-token cookie — no access token required, "always succeeds" per its own docs.
      '/auth/logout',
      '/health',
      '/health/ready',
    ]

    for (const [path, methods] of Object.entries(paths)) {
      if (publicPaths.some((p) => path === p)) continue
      for (const [method, operation] of Object.entries(methods as Record<string, OpenAPIV3.OperationObject>)) {
        if (!['get', 'post', 'put', 'patch', 'delete'].includes(method)) continue
        expect(operation.security, `${method.toUpperCase()} ${path} does not declare a security requirement`).toBeDefined()
      }
    }
  })
})
