import 'dotenv/config'
import { z } from 'zod'

/**
 * Every environment variable the application depends on, validated once at
 * startup. Nothing in the app should read `process.env` directly outside
 * this file — importing `env` is the only sanctioned way to read config, so
 * a missing/malformed variable fails fast at boot instead of surfacing as a
 * confusing runtime error deep in a request handler.
 */
/**
 * A handful of secrets ship as obviously-fake example values in
 * `.env.*.example` — this catches an example file accidentally deployed
 * as-is in a non-development environment instead of failing subtly later.
 */
const PLACEHOLDER_MARKERS = ['replace-with', 'replace-me', 'change-me', 'changeme', 'dev-only', 'example', 'your-', '<']

function looksLikePlaceholder(value: string): boolean {
  const lower = value.toLowerCase()
  return PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker))
}

/** Exported for tests/unit/env.test.ts — validated in isolation via `.safeParse`, not by re-importing this module (which has import-time side effects: reading `process.env` and calling `process.exit` on failure). */
export const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    API_PREFIX: z.string().min(1).default('/api/v1'),

    CORS_ORIGIN: z
      .string()
      .min(1)
      .default('http://localhost:5173')
      .transform((value) => value.split(',').map((origin) => origin.trim())),

    /** Base URL of the frontend — used to build password-reset / email-verification links. */
    FRONTEND_URL: z.string().url().default('http://localhost:5173'),

    MONGODB_URI: z.string().url('MONGODB_URI must be a valid connection string'),
    MONGODB_URI_TEST: z.string().url().optional(),
    /** Mongoose connection pool ceiling — higher in production under real concurrent load, lower for a local/dev single-connection workload. */
    MONGODB_MAX_POOL_SIZE: z.coerce.number().int().positive().default(10),

    /** Optional — every Redis-backed feature (response caching, distributed rate-limit store) degrades to an in-memory/no-op fallback when unset. */
    REDIS_URL: z.string().url().optional(),

    JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
    JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('30d'),
    COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET must be at least 32 characters'),

    /** Failed-login lockout (see auth.service.ts) — attempts allowed before a temporary lock, and how long that lock lasts. */
    LOGIN_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
    LOGIN_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),

    /** Global + auth-specific rate-limit windows (see middlewares/rateLimit.ts). */
    RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(300),
    AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),

    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV !== 'production' && data.NODE_ENV !== 'staging') return

    const secrets: Array<[string, string]> = [
      ['JWT_ACCESS_SECRET', data.JWT_ACCESS_SECRET],
      ['JWT_REFRESH_SECRET', data.JWT_REFRESH_SECRET],
      ['COOKIE_SECRET', data.COOKIE_SECRET],
    ]
    for (const [key, value] of secrets) {
      if (looksLikePlaceholder(value)) {
        ctx.addIssue({ code: 'custom', path: [key], message: `${key} looks like an unfilled example/placeholder value — set a real secret in ${data.NODE_ENV}` })
      }
    }
    if (data.JWT_ACCESS_SECRET === data.JWT_REFRESH_SECRET) {
      ctx.addIssue({ code: 'custom', path: ['JWT_REFRESH_SECRET'], message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different values' })
    }
    if (data.CORS_ORIGIN.some((origin) => origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      ctx.addIssue({ code: 'custom', path: ['CORS_ORIGIN'], message: `CORS_ORIGIN still points at localhost in ${data.NODE_ENV} — set it to the real frontend origin(s)` })
    }
  })

export type Env = z.infer<typeof envSchema>

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('\nInvalid or missing environment variables:\n')
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`)
    }
    console.error('\nCheck backend/.env against backend/.env.example and try again.\n')
    process.exit(1)
  }

  return parsed.data
}

export const env = loadEnv()
export const isProduction = env.NODE_ENV === 'production'
export const isStaging = env.NODE_ENV === 'staging'
export const isDevelopment = env.NODE_ENV === 'development'
export const isTest = env.NODE_ENV === 'test'
