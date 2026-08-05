import bcrypt from 'bcrypt'
import { BCRYPT_SALT_ROUNDS } from '../constants/auth'

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS)
}

export function comparePassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash)
}
