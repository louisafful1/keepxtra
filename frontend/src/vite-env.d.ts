/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** EmailJS service ID — https://dashboard.emailjs.com/admin */
  readonly VITE_EMAILJS_SERVICE_ID?: string
  /** EmailJS template used by the contact form. */
  readonly VITE_EMAILJS_CONTACT_TEMPLATE_ID?: string
  /** EmailJS template used by the newsletter sign-up. */
  readonly VITE_EMAILJS_NEWSLETTER_TEMPLATE_ID?: string
  /** EmailJS public key — https://dashboard.emailjs.com/admin/account */
  readonly VITE_EMAILJS_PUBLIC_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
