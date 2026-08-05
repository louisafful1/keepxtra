import swaggerJsdoc from 'swagger-jsdoc'
import { env } from './env'

/**
 * Base OpenAPI document. Individual endpoints are documented via `@openapi`
 * JSDoc blocks directly above their route definitions (see
 * `routes/health.routes.ts` for the pattern) and are grouped into sections
 * by the `tags` each block declares — one tag per future module
 * (Farmers, Inventory, Sales, ...) so the generated docs read module by
 * module rather than as one flat endpoint list.
 */
const swaggerDefinition: swaggerJsdoc.SwaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'KeepXtra API',
    version: '0.1.0',
    description:
      'KeepXtra cold-chain logistics platform API. This phase only exposes infrastructure endpoints (health checks) — ' +
      'business modules (Farmers, Storage, Inventory, Sales, Payments, ...) are documented here as they ship.',
  },
  servers: [{ url: `http://localhost:${env.PORT}${env.API_PREFIX}`, description: 'Local (versioned API)' }, { url: `http://localhost:${env.PORT}`, description: 'Local (root — health checks)' }],
  tags: [{ name: 'Health', description: 'Liveness & readiness probes' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      ApiErrorBody: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              code: { type: 'string' },
              requestId: { type: 'string' },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
    },
  },
}

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ['./src/routes/**/*.ts', './src/docs/**/*.ts'],
})
