import CountUpImport from 'react-countup'

/**
 * Vite's Rolldown-based dep optimizer doesn't always unwrap react-countup's
 * UMD-style default export, yielding the whole `{ default, useCountUp }`
 * module object at the import site instead of the component itself. Resolve
 * that here once so every call site gets the real component either way.
 */
type CountUpComponent = typeof CountUpImport
const resolved = CountUpImport as unknown as { default?: CountUpComponent }
export const CountUp: CountUpComponent = resolved.default ?? CountUpImport
