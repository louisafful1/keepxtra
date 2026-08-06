import { afterAll, afterEach, beforeAll } from 'vitest'

// Point the app at an isolated test database and dummy secrets *before* any
// application module (which reads `process.env` via `config/env.ts` at
// import time) is loaded.
process.env.NODE_ENV = 'test'
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-0123456789-0123456789'
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-0123456789-0123456789'
process.env.COOKIE_SECRET ??= 'test-cookie-secret-0123456789-0123'
process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/keepxtra_test_placeholder'
process.env.LOG_LEVEL ??= 'silent'

import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

let mongoServer: MongoMemoryServer

beforeAll(async () => {
  // The default 10s launch timeout is too tight the first time Windows
  // Defender scans a freshly-downloaded mongod.exe — give it real headroom.
  mongoServer = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } })
  await mongoose.connect(mongoServer.getUri())

  // `mongoose.connect()` resolving does NOT mean every model's indexes
  // exist yet — index creation is queued and fires in the background per
  // model. Without waiting here, a test file whose very first write is a
  // uniqueness check can race that build and observe no constraint at all
  // (a duplicate insert silently succeeds). Waiting once, up front, makes
  // every unique/partial-unique index test deterministic regardless of
  // which `it` block happens to run first in a given file.
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
})

afterEach(async () => {
  const collections = mongoose.connection.collections
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})))
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})
