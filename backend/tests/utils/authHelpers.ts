import request from 'supertest'
import { testApp } from './testApp'

/** Logs in via the real HTTP endpoint and returns the access token — used by every module's integration tests to act as a given user. */
export async function loginAndGetToken(email: string, password: string): Promise<string> {
  const res = await request(testApp).post('/api/v1/auth/login').send({ email, password })
  if (res.status !== 200) {
    throw new Error(`loginAndGetToken: login failed for ${email} with status ${res.status}: ${JSON.stringify(res.body)}`)
  }
  return res.body.data.accessToken as string
}
