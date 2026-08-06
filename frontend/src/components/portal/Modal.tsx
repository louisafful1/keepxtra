import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  maxWidthClass?: string
}

export function Modal({ open, onClose, title, description, children, maxWidthClass = 'max-w-lg' }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-neutral-950/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className={`my-8 w-full ${maxWidthClass} rounded-2xl bg-white p-6 shadow-premium`}
          >
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-semibold text-neutral-900">{title}</h3>
                {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <X className="size-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export const formInputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50'
export const formLabelClass = 'mb-1.5 block text-sm font-medium text-neutral-700'
