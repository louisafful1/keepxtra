import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

const contactSchema = z.object({
  name: z.string().min(1, 'Your name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  phone: z.string().optional(),
  subject: z.enum(['general', 'partnership', 'careers', 'support']),
  message: z.string().min(10, 'Tell us a little more (min. 10 characters)'),
})

type ContactValues = z.infer<typeof contactSchema>

const subjectOptions: { value: ContactValues['subject']; label: string }[] = [
  { value: 'general', label: 'General inquiry' },
  { value: 'partnership', label: 'Partnership / Become a partner' },
  { value: 'careers', label: 'Careers' },
  { value: 'support', label: 'Existing customer support' },
]

const fieldClasses =
  'w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-50 transition-colors'

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { subject: 'general' },
  })

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 700))
    setSubmitted(true)
    reset()
  }

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex h-full flex-col items-start justify-center gap-3 rounded-3xl border border-primary-200 bg-primary-50 p-8"
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary-500 text-white">
          <Check className="size-5" />
        </span>
        <p className="font-display text-xl font-medium text-neutral-900">Message received.</p>
        <p className="text-sm leading-relaxed text-neutral-600">
          Thanks for reaching out — someone from our team will get back to you shortly. For
          anything urgent, call or WhatsApp us directly.
        </p>
        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          Send another message
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Full name
          </label>
          <input id="name" type="text" placeholder="Your name" className={fieldClasses} {...register('name')} />
          {errors.name && <p className="mt-1.5 text-xs text-secondary-500">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@company.com"
            className={fieldClasses}
            {...register('email')}
          />
          {errors.email && <p className="mt-1.5 text-xs text-secondary-500">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-neutral-700">
            Phone <span className="text-neutral-400">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+233 59 141 4352"
            className={fieldClasses}
            {...register('phone')}
          />
        </div>
        <div>
          <label htmlFor="subject" className="mb-1.5 block text-sm font-medium text-neutral-700">
            What&apos;s this about?
          </label>
          <select id="subject" className={cn(fieldClasses, 'appearance-none')} {...register('subject')}>
            {subjectOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-neutral-700">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          placeholder="Tell us a bit about what you need..."
          className={cn(fieldClasses, 'resize-none')}
          {...register('message')}
        />
        {errors.message && <p className="mt-1.5 text-xs text-secondary-500">{errors.message.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-8 py-3.5 text-sm font-medium text-white shadow-glow transition-colors hover:bg-primary-600 disabled:opacity-60"
      >
        {isSubmitting && <Loader2 className="size-4 animate-spin" />}
        Send message
      </button>
    </form>
  )
}
