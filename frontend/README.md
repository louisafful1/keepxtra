# KeepXtra Frontend

The public marketing site, farmer portal, and operations/admin dashboard for KeepXtra — a single Vite + React + TypeScript app with three route surfaces.

> `authService` now calls the real backend (login/logout/session restore); `farmerService`/`adminService` still run against an in-memory mock service layer — see [../docs/deployment](../docs/deployment/README.md#frontendbackend-integration-status).

## Tech stack

- **React 19** + **TypeScript** (strict)
- **Vite** — dev server & build
- **React Router** — routing (`src/routes/`), including a lazy-loaded, `ProtectedRoute`-gated admin/portal area
- **Tailwind CSS** — styling (`tailwind.config.ts`)
- **TanStack Query** — server-state/data-fetching layer over the service modules
- **React Hook Form** + **Zod** — forms and validation
- **Framer Motion**, **GSAP**, **Lenis** — animation and smooth scroll
- **Recharts** — dashboard/analytics charts
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
├── pages/
│   ├── website/   Public marketing site (home, about, services, investors, blog, ...)
│   ├── auth/       Login
│   ├── portal/     Farmer-facing portal (produce, storage requests, pickups, sales, payments, ...)
│   └── admin/       Operations/admin dashboard (farmers, inventory, warehouses, fleet, sales, reports, ...)
├── layouts/         WebsiteLayout, PortalLayout, AdminLayout
├── routes/          Router config + ProtectedRoute
├── components/      ui/, layout/, portal/ — shared UI building blocks
├── contexts/        AuthContext
├── hooks/           Data-fetching hooks (useAdminQueries, useFarmerQueries, ...) and utility hooks
├── services/        authService (wired to the real backend) / farmerService / adminService (still mocked, see note above)
├── animation/        GSAP/Lenis scroll setup
├── data/            Static content for the marketing site
├── lib/ / utils/     Small shared helpers
└── types/            Shared TypeScript types, incl. the RBAC permission model
```

## Path alias

`@/*` resolves to `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## Backend integration

The `src/services/{auth,farmer,admin}Service.ts` modules define the exact contract the real backend (`../backend/`) is built to satisfy — see [../docs/api](../docs/api/README.md). `authService.ts` now calls the real API (set `VITE_API_URL` — see `.env.example` — to point it somewhere other than `http://localhost:4000/api/v1`); wiring `farmerService`/`adminService` is the same pattern (replace the mock implementation with a real `fetch` call against the same exported function signatures) — see `authService.ts` as the reference implementation, including how it bridges the backend's real RBAC role names onto the frontend's existing `'farmer' | 'admin'` routing model without changing that model.

**Note:** the "Demo accounts" hint text on the login page (`farmer@keepxtra.com` / `admin@keepxtra.com`) refers to the old mock accounts. Those exact credentials won't work against a real backend unless you seed matching accounts (`npm run seed` in `backend/`, or create them directly) — update or remove that hint once wiring the rest of the app to the live API.
