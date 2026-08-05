import { Counter } from '../models/counter.model'

/** Atomically increments and returns the next value in a named sequence — race-safe under concurrent calls. */
export async function getNextSequenceValue(sequenceName: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after' },
  ).exec()

  return counter.seq
}
