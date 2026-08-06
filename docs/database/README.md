# Database

KeepXtra uses **MongoDB** (MongoDB Atlas in production) via **Mongoose**. The backend owns the schema — see `backend/src/models/`.

## Connection

Configured entirely through environment variables (see `backend/.env.example`):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Primary connection string (development/production) |
| `MONGODB_URI_TEST` | Optional override used automatically when `NODE_ENV=test` |

`backend/src/config/database.ts` connects with retry + linear backoff on startup and exposes `getDatabaseState()` for the `/health` endpoint.

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
