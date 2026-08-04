import { useContext } from 'react'
import { ConfirmContext } from '@/components/portal/ConfirmDialog'

export function useConfirm() {
  const confirm = useContext(ConfirmContext)
  if (!confirm) throw new Error('useConfirm must be used within a ConfirmDialogProvider')
  return confirm
}
