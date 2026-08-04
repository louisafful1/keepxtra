/**
 * Stands in for a real HTTP client. Every service function is async and
 * routes through here so swapping in `fetch`/`axios` later is a one-line
 * change per call site rather than a rewrite of the calling code.
 */
export function simulateRequest<T>(data: T, delayMs = 450): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(structuredClone(data)), delayMs)
  })
}

export function simulateMutation<T>(data: T, delayMs = 600): Promise<T> {
  return simulateRequest(data, delayMs)
}

export class ApiError extends Error {
  status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
