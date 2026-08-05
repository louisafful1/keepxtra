import { createApp } from '../../src/app'

/** A supertest-ready Express app instance, sharing the in-memory Mongo connection from tests/setup.ts. */
export const testApp = createApp()
