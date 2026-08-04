import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-neutral-200/70 bg-white py-20 shadow-soft">
      <div className="size-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  )
}

export function ErrorBlock({ message = 'Something went wrong. Please try again.' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-red-200 bg-red-50 py-20 text-center">
      <AlertTriangle className="size-6 text-red-500" strokeWidth={1.75} />
      <p className="text-sm text-red-600">{message}</p>
    </div>
  )
}

export function AsyncState({
  isLoading,
  isError,
  errorMessage,
  loadingLabel,
  children,
}: {
  isLoading: boolean
  isError: boolean
  errorMessage?: string
  loadingLabel?: string
  children: ReactNode
}) {
  if (isLoading) return <LoadingBlock label={loadingLabel} />
  if (isError) return <ErrorBlock message={errorMessage} />
  return <>{children}</>
}
