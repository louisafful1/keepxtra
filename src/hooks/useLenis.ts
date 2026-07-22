import { useContext } from 'react'
import { LenisContext } from '@/animation/LenisProvider'

export function useLenis() {
  return useContext(LenisContext)
}
