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
      'KeepXtra cold-chain logistics platform API. Authentication is fully implemented; business modules ' +
      '(Farmers, Storage, Inventory, Sales, Payments, ...) are documented here as they ship.',
  },
  servers: [{ url: `http://localhost:${env.PORT}${env.API_PREFIX}`, description: 'Local (versioned API)' }, { url: `http://localhost:${env.PORT}`, description: 'Local (root — health checks)' }],
  tags: [
    { name: 'Health', description: 'Liveness & readiness probes' },
    { name: 'Auth', description: 'Login, tokens, password reset, and email verification' },
    { name: 'Farmers', description: 'Farmer registration, profiles, and lifecycle management' },
  ],
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
      SafeUser: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          name: { type: 'string', example: 'Kwame Asante' },
          email: { type: 'string', example: 'farmer@keepxtra.com' },
          phone: { type: 'string', example: '+233 24 000 0000' },
          avatarInitials: { type: 'string', example: 'KA' },
          status: { type: 'string', example: 'Active' },
          emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true },
          role: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string', example: 'Farmer' },
              permissions: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
      AuthenticatedUser: {
        type: 'object',
        description: "The request-scoped view of the caller attached by the `authenticate` middleware — what GET /auth/me returns.",
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          name: { type: 'string' },
          phone: { type: 'string' },
          avatarInitials: { type: 'string' },
          status: { type: 'string', example: 'Active' },
          emailVerifiedAt: { type: 'string', format: 'date-time', nullable: true },
          roleId: { type: 'string' },
          roleName: { type: 'string', example: 'Farmer' },
          permissions: { type: 'array', items: { type: 'string' } },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Logged in successfully' },
          data: {
            type: 'object',
            properties: {
              user: { $ref: '#/components/schemas/SafeUser' },
              accessToken: { type: 'string' },
              expiresAt: { type: 'integer', description: 'Epoch milliseconds the access token expires at' },
            },
          },
        },
      },
      Farmer: {
        type: 'object',
        properties: {
          id: { type: 'string', example: '665f1a2b3c4d5e6f7a8b9c0d' },
          userId: { type: 'string' },
          farmerNumber: { type: 'string', example: 'FRM-00001' },
          firstName: { type: 'string', example: 'Kwame' },
          lastName: { type: 'string', example: 'Asante' },
          fullName: { type: 'string', example: 'Kwame Asante' },
          phone: { type: 'string', example: '+233 24 000 0000' },
          alternativePhone: { type: 'string', nullable: true },
          email: { type: 'string', example: 'kwame@keepxtra.com' },
          nationalId: { type: 'string', nullable: true },
          farmName: { type: 'string', example: 'Asante Farms' },
          farmLocation: { type: 'string', example: 'Nsawam Farm Gate' },
          district: { type: 'string', example: 'Nsawam-Adoagyiri' },
          region: { type: 'string', example: 'Eastern' },
          gpsCoordinates: {
            type: 'object',
            nullable: true,
            properties: { lat: { type: 'number' }, lng: { type: 'number' } },
          },
          primaryCrops: { type: 'array', items: { type: 'string' }, example: ['Tomatoes', 'Maize'] },
          preferredPickupDays: { type: 'array', items: { type: 'string' }, example: ['Monday', 'Thursday'] },
          preferredPaymentMethod: { type: 'string', enum: ['Mobile Money', 'Bank Transfer'] },
          bankDetails: {
            type: 'object',
            nullable: true,
            properties: { bankName: { type: 'string' }, accountNumber: { type: 'string' }, accountName: { type: 'string' } },
          },
          mobileMoneyDetails: {
            type: 'object',
            nullable: true,
            properties: { provider: { type: 'string' }, phoneNumber: { type: 'string' } },
          },
          status: { type: 'string', enum: ['Active', 'Inactive'] },
          notes: { type: 'string', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      FarmerListResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'array', items: { $ref: '#/components/schemas/Farmer' } },
          meta: { $ref: '#/components/schemas/PaginationMeta' },
        },
      },
    },
  },
}

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ['./src/routes/**/*.ts', './src/docs/**/*.ts'],
})
