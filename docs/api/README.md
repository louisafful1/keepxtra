# API Documentation

The KeepXtra backend exposes a versioned REST API under `/api/v1`, documented live via OpenAPI/Swagger — the source of truth for request/response shapes is the running server, not this file.

## Live documentation

| Endpoint | Purpose |
|---|---|
| `GET /docs` | Interactive Swagger UI |
| `GET /docs.json` | Raw OpenAPI 3 spec (importable into Postman/Insomnia) |
| `GET /health` | Liveness/readiness probe (unversioned, outside `/api/v1`) |

Run the backend locally (see [deployment guide](../deployment/README.md#backend)) and open `http://localhost:4000/docs`.

## Conventions

- **Base path:** `/api/v1` (configurable via `API_PREFIX`).
- **Auth:** Bearer JWT access token in the `Authorization` header, obtained via `POST /api/v1/auth/login`; refresh tokens are issued as an httpOnly cookie. See [security](../security/README.md).
- **Response envelope:** every endpoint returns `{ success, message?, data }`; list endpoints return `{ success, message?, data, meta }` with `meta` carrying pagination (`page`, `pageSize`, `total`, `totalPages`).
- **Errors:** `{ success: false, error: { message, code, details? } }` with a matching HTTP status (400/401/403/404/409/422/500).
- **Pagination/filtering/sorting:** list endpoints share a common query vocabulary — `page`, `pageSize`, `search`, `sortBy`, `sortDir`, `from`/`to` date range, plus resource-specific filters.
- **Reports export:** report endpoints under `/api/v1/reports/*` accept `?format=json|csv|pdf` to switch the response between the default JSON payload and a downloadable CSV/PDF file.

## Modules

Auth, Farmers, Storage Requests, Pickups, Warehouses, Cold Rooms, Inventory, Quality Inspections, Fleet (Vehicles/Drivers), Customers, Orders, Payouts, Notifications, and Reports & Analytics — each mounted as its own router under `/api/v1` (see `backend/src/routes/index.ts`) and documented with full request/response schemas in the Swagger UI.
