# KeepXtra Frontend

The KeepXtra public marketing website — a single Vite + React + TypeScript app.

> The farmer portal and operations/admin dashboard have been removed from this repository. They will live in the separate **XtraStore** product, served from its own domain with its own backend.

## Tech stack

- **React 19** + **TypeScript** (strict)
- **Vite** — dev server & build
- **React Router** — routing (`src/routes/`)
- **Tailwind CSS** — styling (`tailwind.config.ts`)
- **React Hook Form** + **Zod** — forms and validation
- **EmailJS** — contact form & newsletter submission (`@emailjs/browser`)
- **Framer Motion**, **GSAP**, **Lenis** — animation and smooth scroll
- **react-helmet-async** — per-page SEO tags
- **oxlint** — linting

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then build to `dist/` |
| `npm run lint` | Run oxlint |
| `npm run preview` | Preview a production build locally |

## Structure

```
src/
├── pages/website/   Public marketing pages (home, about, services, partners, investors, blog, faq, careers, contact)
├── sections/         Composed page sections
├── layouts/          WebsiteLayout
├── routes/           Router config
├── components/       ui/ (design system) and layout/ (navbar, footer, mobile menu, ...)
├── animation/        GSAP/Lenis scroll setup
├── data/             Static content for the marketing site
├── hooks/            Small UI/animation hooks
├── lib/              Shared helpers (cn, seo, countup)
└── styles/           Global styles
```

## Path alias

`@/*` resolves to `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## Environment variables

The contact and newsletter forms send through [EmailJS](https://www.emailjs.com/). Copy
`.env.example` to `.env` and fill in your credentials:

| Variable | Purpose |
|---|---|
| `VITE_EMAILJS_PUBLIC_KEY` | EmailJS public key (Account page) |
| `VITE_EMAILJS_SERVICE_ID` | The EmailJS email service to send through |
| `VITE_EMAILJS_CONTACT_TEMPLATE_ID` | Template for contact-form messages |
| `VITE_EMAILJS_NEWSLETTER_TEMPLATE_ID` | Template for newsletter sign-ups |

Template variables the app sends — make sure each template references them:

- **Contact:** `from_name`, `reply_to`, `phone`, `subject`, `message`
- **Newsletter:** `from_name`, `reply_to`, `email`

> Vite inlines these at build time, so they must be present in the environment that runs
> `npm run build` (e.g. your host's build settings), not just locally. Without them the
> forms show a clear "not configured" error instead of silently failing.
