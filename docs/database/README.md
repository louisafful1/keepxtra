# Database

KeepXtra uses **MongoDB** (MongoDB Atlas in production) via **Mongoose**. The backend owns the schema — see `backend/src/models/`.

## Connection

Configured entirely through environment variables (see `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Primary connection string (development/production) |
| `MONGODB_URI_TEST` | Optional override used automatically when `NODE_ENV=test` |
| `MONGODB_MAX_POOL_SIZE` | Mongoose connection pool ceiling (default 10; raise for real concurrent production load) |

`backend/src/config/database.ts` connects with retry + linear backoff on startup and exposes `getDatabaseState()` for the `/health` endpoint. It also enables MongoDB driver command monitoring and logs any query slower than 200ms (`dbLogger.warn`, `"Slow MongoDB query"`) — the same mechanism catches slow queries issued through Mongoose *and* raw aggregations (e.g. `report.repository.ts`) alike.

## Conventions

Applied consistently across every business collection (see `backend/src/models/plugins/auditable.plugin.ts` and `backend/src/repositories/base.repository.ts`):

- **Soft delete:** `isDeleted: boolean` + `deletedAt: Date | null` — no business record is ever hard-deleted. `BaseRepository` filters `isDeleted: false` by default on every read.
- **Audit fields:** `createdBy` / `updatedBy` (`ObjectId → User`, nullable for system-generated writes), plus Mongoose-managed `createdAt` / `updatedAt` timestamps.
- **Append-only ledgers:** a few collections (`InventoryMovement`, `VehicleMaintenanceRecord`, `VehicleFuelRecord`) are write-once history logs with no soft-delete concept.
- **Denormalized snapshots:** frequently-read fields (e.g. a farmer's name/number on a `StorageRequest`) are copied at creation time so list/search endpoints can filter with a plain regex instead of a `$lookup` aggregation.

## Collections

| Collection | Model | Notes |
|---|---|---|
| `users` | `User` | Root login identity for every actor (farmer or operations staff) |
| `roles` / `permissions` | `Role`, `Permission` | RBAC — see [security](../security/README.md) |
| `refreshtokens`, `passwordresettokens`, `emailverificationtokens` | — | Auth session/token lifecycle |
| `auditlogs` | `AuditLog` | Compliance trail — who changed what, when |
| `counters` | `Counter` | Atomic sequence generator behind human-readable codes (`FRM-00001`, `SR-00001`, …) |
| `farmers` | `Farmer` | Farming-business profile linked 1:1 to a `User` |
| `storagerequests` | `StorageRequest` | Entry point of the produce lifecycle |
| `pickups` | `Pickup` | Auto-created when a Storage Request is approved |
| `warehouses` / `coldrooms` | `Warehouse`, `ColdRoom` | Physical storage capacity and zones |
| `inventories` / `inventorymovements` | `Inventory`, `InventoryMovement` | Auto-created when a Pickup completes; movement ledger for adjustments/transfers/disposals |
| `qualityinspections` | `QualityInspection` | Auto-created when Inventory is received |
| `vehicles` / `drivers` / `vehiclemaintenancerecords` / `vehiclefuelrecords` | — | Fleet management |
| `customers` / `orders` | `Customer`, `Order` | Sales pipeline |
| `payouts` | `Payout` | Auto-created when an Order is confirmed, one per farmer represented |
| `notifications` / `notificationpreferences` | — | In-app notifications and per-user delivery preferences |

## Event-driven auto-creation

Several collections are never created directly over HTTP — they're spawned by an event listener reacting to a prior module's completion event (Storage Request approved → Pickup; Pickup completed → Inventory; Inventory received → Quality Inspection; Order confirmed → Payout). See `backend/src/events/` and [architecture](../architecture/BACKEND_ARCHITECTURE.md).

## Migrations

`backend/src/migrations/` is a lightweight, explicit migration chain — no external framework. Each migration is a small module exporting `{ id, description, up() }`, listed in order in `registry.ts`; a `migrations` collection records which have run, so `npm run migrate` is always safe to re-run (already-applied ones are skipped).

```bash
npm run migrate
```

To add one: create `src/migrations/000N_description.ts` following the pattern in `0001_sync_indexes.ts`, then append it to the array in `registry.ts`. Never edit or reorder a migration that may already have run anywhere — add a new one to correct it instead, the same rule as any SQL migration chain.

The first migration, `0001_sync_indexes`, reconciles every collection's actual indexes with what its current Mongoose schema declares — useful any time a schema's `.index(...)` calls change (as happened when `order.model.ts` gained a `{status, confirmedAt}` index alongside the Reports module).

## Seeding

`npm run seed` (`backend/scripts/seed.ts` → `src/seeding/seed.ts`) makes the database agree with `src/constants/{permissions,roles}.ts` — the permission catalogue and role definitions are otherwise just TypeScript data with no effect until seeded. Idempotent: re-running resyncs each role's permission set without duplicating anything. Optionally creates the first Super Admin login from `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` if set and no user with that email exists yet — the only way into a brand-new deployment before any other account exists.

## Backups

`backend/scripts/backup.sh` / `restore.sh` wrap `mongodump`/`mongorestore` (MongoDB Database Tools required on PATH):

```bash
npm run backup                    # dumps to ./backups/keepxtra-backup-<timestamp>.gz, prunes anything older than 14 days
npm run restore -- <archive-path> # DESTRUCTIVE — prompts for confirmation unless --force is passed
```

If using MongoDB Atlas, prefer Atlas's own continuous backup / point-in-time recovery for production — these scripts are for a self-hosted MongoDB (e.g. the `mongo` service in `docker-compose.prod.yml`) or for taking an ad hoc local snapshot.

## Index review

Every collection's indexes are declared alongside its schema in `backend/src/models/*.model.ts`, chosen to match the actual filter/sort combinations each module's list and report endpoints use (equality + sort compound indexes, e.g. `{status, createdAt}`; TTL indexes for token expiry; a text-search-friendly denormalized-field pattern instead of `$lookup` aggregations for cross-collection search — see [Conventions](#conventions) above). Run `0001_sync_indexes` (or add a new migration) any time a model's indexes change in a way existing collections need to catch up to.
