import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formErrorMessage, subscribeToNewsletter } from '@/lib/emailjs'

const newsletterSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
})

type NewsletterValues = z.infer<typeof newsletterSchema>

export function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewsletterValues>({ resolver: zodResolver(newsletterSchema) })

  async function onSubmit(values: NewsletterValues) {
    setSubmitError(null)
    try {
      await subscribeToNewsletter(values.email)
      setSubmitted(true)
      reset()
    } catch (error) {
      setSubmitError(formErrorMessage(error))
    }
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700"
      >
        <Check className="size-4" />
        You&apos;re on the list — thank you.
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white p-1.5 pl-5 shadow-soft">
        <input
          type="email"
          placeholder="Your email address"
          className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
          {...register('email')}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition-transform duration-200 hover:scale-105 disabled:opacity-60"
          aria-label="Subscribe"
        >
          <ArrowRight className="size-4" />
        </button>
      </div>
      <p
        role={submitError ? 'alert' : undefined}
        className={cn(
          'mt-2 min-h-[1.25rem] pl-5 text-xs transition-opacity',
          errors.email || submitError
            ? 'text-secondary-500 opacity-100'
            : 'text-secondary-400 opacity-0',
        )}
      >
        {errors.email?.message ?? submitError}
      </p>
    </form>
  )
}
