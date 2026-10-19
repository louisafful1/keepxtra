# KeepXtra

**Powering Africa's fresh produce supply chain.**

KeepXtra is technology-driven logistics infrastructure that reduces post-harvest food loss — connecting farmers to cold storage, quality assurance, and delivery for restaurants, hotels, retailers, and households.

This repository contains the **KeepXtra public marketing website** (home, about, services, partners, investors, blog, FAQ, careers, and contact).

> **Note:** the farmer portal and operations/admin dashboard have been removed from this repository. They will live in a separate product — **XtraStore** — served from its own domain, alongside its own backend API.

---

## Tech stack

| | |
|---|---|
| **Framework** | React 19, TypeScript, Vite |
| **Routing** | React Router |
| **Styling** | Tailwind CSS |
| **Forms** | React Hook Form + Zod, EmailJS (contact & newsletter) |
| **Animation** | Framer Motion, GSAP, Lenis |
| **SEO** | react-helmet-async |
| **Tooling** | oxlint, Prettier, Docker, GitHub Actions CI |

## Repository structure

```
KeepXtra/
├── frontend/     React + Vite marketing website (the company site)
├── pitch-deck/   Standalone script that generates the investor pitch-deck PDF
└── .github/      CI workflows
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev       # http://localhost:5173
```

Details: [frontend/README.md](frontend/README.md).

## Environment variables

The contact and newsletter forms send through **EmailJS** — copy `frontend/.env.example` to
`frontend/.env` and set the `VITE_EMAILJS_*` variables. They must be present at build time.
Full reference: [frontend/README.md](frontend/README.md#environment-variables).

## Build & preview

```bash
cd frontend
npm run build     # type-check + production build to frontend/dist
npm run preview   # preview the production build locally
```

## Deployment

The website is a static build (`frontend/dist`) that can be served from any CDN or static host. It ships a multi-stage `Dockerfile` (built with Node, served by Nginx) for containerized hosting.

## Roadmap

- Add screenshots to this README
- Set the EmailJS credentials in the build environment so the contact & newsletter forms deliver (see [frontend/README.md](frontend/README.md#environment-variables))

## License

[MIT](LICENSE)
