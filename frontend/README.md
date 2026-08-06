# KeepXtra Frontend

The public marketing site, farmer portal, and operations/admin dashboard for KeepXtra — a single Vite + React + TypeScript app with three route surfaces.

> Currently runs against an in-memory mock service layer, not the real backend — see [../docs/deployment](../docs/deployment/README.md#frontendbackend-integration-status).

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
├── services/        authService / farmerService / adminService — the API contract layer (currently mocked, see note above)
├── animation/        GSAP/Lenis scroll setup
├── data/            Static content for the marketing site
├── lib/ / utils/     Small shared helpers
└── types/            Shared TypeScript types, incl. the RBAC permission model
```

## Path alias

`@/*` resolves to `src/*` (configured in both `vite.config.ts` and `tsconfig.app.json`).

## Backend integration

The `src/services/{auth,farmer,admin}Service.ts` modules define the exact contract the real backend (`../backend/`) is built to satisfy — see [../docs/api](../docs/api/README.md). Wiring a given screen to the live API is a matter of replacing that service's mock implementation with a real HTTP call against the same function signature.
