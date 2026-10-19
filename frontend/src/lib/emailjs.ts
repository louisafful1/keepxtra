import emailjs from '@emailjs/browser'

interface EmailJsConfig {
  serviceId: string
  publicKey: string
  contactTemplateId: string
  newsletterTemplateId: string
}

/**
 * Reads the EmailJS credentials from Vite environment variables and fails loudly
 * (with a developer-actionable message) if any are missing. Values are inlined at
 * build time, so they must be present in the environment that runs `npm run build`.
 */
function readConfig(): EmailJsConfig {
  const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID
  const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY
  const contactTemplateId = import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID
  const newsletterTemplateId = import.meta.env.VITE_EMAILJS_NEWSLETTER_TEMPLATE_ID

  if (!serviceId || !publicKey || !contactTemplateId || !newsletterTemplateId) {
    const missing = Object.entries({
      VITE_EMAILJS_SERVICE_ID: serviceId,
      VITE_EMAILJS_PUBLIC_KEY: publicKey,
      VITE_EMAILJS_CONTACT_TEMPLATE_ID: contactTemplateId,
      VITE_EMAILJS_NEWSLETTER_TEMPLATE_ID: newsletterTemplateId,
    })
      .filter(([, value]) => !value)
      .map(([key]) => key)

    throw new Error(
      `The email service isn't configured yet (missing ${missing.join(', ')}). ` +
        'Copy frontend/.env.example to frontend/.env and fill in your EmailJS credentials.',
    )
  }

  return { serviceId, publicKey, contactTemplateId, newsletterTemplateId }
}

export interface ContactMessage {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

/**
 * Sends a contact-form submission through EmailJS. Template variables expected on
 * the EmailJS template: `from_name`, `reply_to`, `phone`, `subject`, `message`.
 */
export async function sendContactMessage(message: ContactMessage): Promise<void> {
  const config = readConfig()

  await emailjs.send(
    config.serviceId,
    config.contactTemplateId,
    {
      from_name: message.name,
      reply_to: message.email,
      phone: message.phone ?? '',
      subject: message.subject,
      message: message.message,
    },
    { publicKey: config.publicKey },
  )
}

/**
 * Subscribes an address to the newsletter through EmailJS. Template variables
 * expected on the EmailJS newsletter template: `from_name`, `reply_to`, `email`.
 */
export async function subscribeToNewsletter(email: string): Promise<void> {
  const config = readConfig()

  await emailjs.send(
    config.serviceId,
    config.newsletterTemplateId,
    {
      from_name: 'KeepXtra website',
      reply_to: email,
      email,
    },
    { publicKey: config.publicKey },
  )
}

/** Normalizes any thrown value into a message safe to show in the UI. */
export function formErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong sending your message. Please try again, or call us directly.'
}
