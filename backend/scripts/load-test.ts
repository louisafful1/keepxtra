/**
 * A small, real load/stress test against a *running* backend instance — not
 * a toy. Uses autocannon (a Node-based load generator, easy to run anywhere
 * `npm` runs, unlike a separately-installed binary like k6/wrk) to hammer
 * a couple of representative endpoints and report throughput/latency, then
 * exits non-zero if the error rate is too high — usable as a release gate,
 * not just an ad hoc script.
 *
 * Usage:
 *   npm run dev                                          # in one terminal
 *   npm run load-test                                     # in another
 *
 *   LOAD_TEST_DURATION_SECONDS=30 LOAD_TEST_CONNECTIONS=50 npm run load-test
 *
 * To also load-test an authenticated, cached endpoint (reports/dashboard —
 * the one endpoint Phase 5 added Redis caching to):
 *   LOAD_TEST_EMAIL=admin@example.com LOAD_TEST_PASSWORD=... npm run load-test
 *
 * A FAIL here isn't automatically an app bug — a high enough CONNECTIONS
 * value against a single account will legitimately trip rate limiting
 * (RATE_LIMIT_MAX_REQUESTS / AUTH_RATE_LIMIT_MAX_REQUESTS), which is the
 * limiter doing exactly what it's for. Check whether the failures are 429s
 * (limiter working as designed — tune the limit for your expected real
 * traffic) versus 5xx (an actual bug) before concluding anything's broken.
 */
import autocannon, { type Result } from 'autocannon'

const BASE_URL = process.env.LOAD_TEST_BASE_URL ?? 'http://localhost:4000'
const DURATION_SECONDS = Number(process.env.LOAD_TEST_DURATION_SECONDS ?? 10)
const CONNECTIONS = Number(process.env.LOAD_TEST_CONNECTIONS ?? 10)
/** Fail the run if more than this fraction of responses are non-2xx. */
const MAX_ERROR_RATE = 0.01

interface ScenarioResult {
  name: string
  result: Result
}

async function run(name: string, path: string, opts: Partial<autocannon.Options> = {}): Promise<ScenarioResult> {
  console.log(`\n--- ${name} ---`)
  const result = await autocannon({
    url: `${BASE_URL}${path}`,
    duration: DURATION_SECONDS,
    connections: CONNECTIONS,
    ...opts,
  })
  autocannon.printResult(result, { outputStream: process.stdout })
  return { name, result }
}

async function login(email: string, password: string): Promise<string | null> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (res.status !== 200) {
    console.warn(`Login failed (${res.status}) — skipping authenticated scenarios.`)
    return null
  }
  const body = (await res.json()) as { data: { accessToken: string } }
  return body.data.accessToken
}

async function main(): Promise<void> {
  console.log(`Load testing ${BASE_URL} — ${CONNECTIONS} connections for ${DURATION_SECONDS}s per scenario`)

  const scenarios: ScenarioResult[] = []
  scenarios.push(await run('GET /health (liveness, no DB/auth)', '/health'))

  const email = process.env.LOAD_TEST_EMAIL
  const password = process.env.LOAD_TEST_PASSWORD
  if (email && password) {
    const token = await login(email, password)
    if (token) {
      scenarios.push(
        await run('GET /api/v1/reports/dashboard (authenticated, Redis-cached)', '/api/v1/reports/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
    }
  } else {
    console.log('\n(Set LOAD_TEST_EMAIL/LOAD_TEST_PASSWORD to also load-test an authenticated endpoint.)')
  }

  let failed = false
  console.log('\n=== Summary ===')
  for (const { name, result } of scenarios) {
    const total = result.non2xx + result['2xx']
    const errorRate = total > 0 ? result.non2xx / total : 0
    const status = errorRate > MAX_ERROR_RATE ? 'FAIL' : 'PASS'
    if (status === 'FAIL') failed = true
    console.log(
      `${status} — ${name}: ${result.requests.average.toFixed(0)} req/s avg, p99 ${result.latency.p99}ms, ` +
        `${(errorRate * 100).toFixed(2)}% errors (${result.non2xx}/${total})`,
    )
  }

  process.exitCode = failed ? 1 : 0
}

main().catch((err: unknown) => {
  console.error('Load test crashed:', err)
  process.exitCode = 1
})
