export interface Migration {
  /** Stable, never reused once applied anywhere — conventionally a zero-padded sequence number plus a short slug. */
  id: string
  description: string
  up: () => Promise<void>
}
