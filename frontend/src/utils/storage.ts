export function readStorage<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeStorage<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — fail silently, session just won't persist.
  }
}

export function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // ignore
  }
}
