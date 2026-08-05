import { createContext, useCallback, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

export type ToastVariant = 'success' | 'error' | 'info'

interface ToastOptions {
  description?: string
  variant?: ToastVariant
  durationMs?: number
}

interface ToastRecord extends ToastOptions {
  id: string
  title: string
}

type ToastFn = (title: string, options?: ToastOptions) => void

export const ToastContext = createContext<ToastFn | null>(null)

const variantStyles: Record<ToastVariant, { icon: typeof CheckCircle2; iconClass: string }> = {
  success: { icon: CheckCircle2, iconClass: 'text-primary-600' },
  error: { icon: XCircle, iconClass: 'text-red-500' },
  info: { icon: Info, iconClass: 'text-blue-500' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([])
  const counter = useRef(0)

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback<ToastFn>(
    (title, options = {}) => {
      counter.current += 1
      const id = `toast-${counter.current}`
      setToasts((prev) => [...prev, { id, title, ...options }])
      const duration = options.durationMs ?? 4000
      setTimeout(() => dismiss(id), duration)
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[200] flex flex-col items-center gap-2 p-4 sm:items-end">
        <AnimatePresence>
          {toasts.map((t) => {
            const variant = t.variant ?? 'info'
            const { icon: Icon, iconClass } = variantStyles[variant]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-premium',
                )}
              >
                <Icon className={cn('size-5 shrink-0', iconClass)} strokeWidth={1.75} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-sm text-neutral-500">{t.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss"
                  className="flex size-6 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <X className="size-3.5" />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
