import type { AuthenticatedUser } from '../interfaces/auth.interface'

declare global {
  namespace Express {
    interface Request {
      /** Populated by the `authenticate` middleware once a module wires it into a route. */
      user?: AuthenticatedUser
    }
  }
}

export {}
