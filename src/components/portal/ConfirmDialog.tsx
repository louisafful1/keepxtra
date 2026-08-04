import { createContext, useCallback, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  /** Optional free-text input (e.g. rejection reason) collected alongside the confirmation. */
  requireNote?: boolean
  noteLabel?: string
  notePlaceholder?: string
}

type ConfirmFn = (options: ConfirmOptions) => Promise<{ confirmed: boolean; note?: string }>

const ConfirmContext = createContext<ConfirmFn | null>(null)

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [note, setNote] = useState('')
  const resolver = useRef<(result: { confirmed: boolean; note?: string }) => void>(undefined)

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts)
    setNote('')
    return new Promise((resolve) => {
      resolver.current = resolve
    })
  }, [])

  function close(confirmed: boolean) {
    resolver.current?.({ confirmed, note: note.trim() || undefined })
    setOptions(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {options && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950/40 p-4"
            onClick={() => close(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-premium"
            >
              <div className="flex items-start gap-3">
                {options.tone === 'danger' && (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <AlertTriangle className="size-4.5" strokeWidth={1.75} />
                  </span>
                )}
                <div>
                  <h3 className="font-display text-base font-semibold text-neutral-900">{options.title}</h3>
                  {options.description && <p className="mt-1.5 text-sm text-neutral-500">{options.description}</p>}
                </div>
              </div>

              {options.requireNote && (
                <div className="mt-4">
                  {options.noteLabel && <label className="mb-1.5 block text-xs font-medium text-neutral-600">{options.noteLabel}</label>}
                  <textarea
                    autoFocus
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={options.notePlaceholder}
                    className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50"
                  />
                </div>
              )}

              <div className="mt-5 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => close(false)}
                  className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-50"
                >
                  {options.cancelLabel ?? 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={options.requireNote && !note.trim()}
                  onClick={() => close(true)}
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                    options.tone === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-500 hover:bg-primary-600',
                  )}
                >
                  {options.confirmLabel ?? 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  )
}

export { ConfirmContext }
