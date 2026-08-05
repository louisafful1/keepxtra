import { Schema, model, type Document } from 'mongoose'

/** Atomic sequence generator for human-readable IDs (farmer numbers, invoice numbers, ...). */
export interface ICounter extends Document<string> {
  seq: number
}

const counterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
})

export const Counter = model<ICounter>('Counter', counterSchema)
