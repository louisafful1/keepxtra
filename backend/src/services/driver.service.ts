import { driverRepository } from '../repositories/driver.repository'
import { vehicleRepository } from '../repositories/vehicle.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import type { IDriver } from '../models/driver.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { DriverDto } from '../types/driver.dto'
import type {
  AssignVehicleInput,
  CreateDriverInput,
  DriverListQuery,
  LogTripInput,
  UpdateDriverInput,
  UpdateDriverStatusInput,
} from '../validators/driver.validators'

export interface RequestMeta {
  ip?: string | null
}

function describe(driver: Pick<IDriver, 'driverCode' | 'name'>): string {
  return `${driver.driverCode} (${driver.name})`
}

function toDto(driver: IDriver): DriverDto {
  return {
    id: driver._id.toString(),
    driverCode: driver.driverCode,
    userId: driver.userId?.toString() ?? null,
    name: driver.name,
    phone: driver.phone,
    licenseNumber: driver.licenseNumber,
    licenseExpiryDate: driver.licenseExpiryDate,
    status: driver.status,
    assignedVehicleId: driver.assignedVehicleId?.toString() ?? null,
    totalTripsCompleted: driver.totalTripsCompleted,
    performanceRating: driver.performanceRating,
    isLicenseExpired: driver.licenseExpiryDate < new Date(),
    notes: driver.notes,
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  }
}

async function create(input: CreateDriverInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<DriverDto> {
  const driverCode = `DR-${String(await getNextSequenceValue('driver')).padStart(5, '0')}`

  const driver = await driverRepository.create({
    driverCode,
    name: input.name,
    phone: input.phone,
    licenseNumber: input.licenseNumber,
    licenseExpiryDate: input.licenseExpiryDate,
    notes: input.notes ?? null,
    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Driver Created',
    entityType: 'Driver',
    entityId: driver._id.toString(),
    affectedRecord: describe(driver),
    newValue: 'Available',
    ip: meta.ip,
  })

  return toDto(driver)
}

async function getById(id: string): Promise<DriverDto> {
  const driver = await driverRepository.findById(id)
  if (!driver) throw ApiError.notFound('Driver not found')
  return toDto(driver)
}

async function list(query: DriverListQuery): Promise<{ data: DriverDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<IDriver>({
    search: query,
    searchableFields: ['driverCode', 'name', 'phone', 'licenseNumber'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    driverRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    driverRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function update(id: string, input: UpdateDriverInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<DriverDto> {
  const driver = await driverRepository.findById(id)
  if (!driver) throw ApiError.notFound('Driver not found')

  const changedKeys = Object.keys(input) as (keyof IDriver)[]
  const before = driver as unknown as Record<string, unknown>

  const updated = await driverRepository.updateById(id, { ...input, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Driver not found')

  const after = updated as unknown as Record<string, unknown>
  await auditService.record({
    actor,
    action: 'Driver Updated',
    entityType: 'Driver',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, before[key]]))),
    newValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, after[key]]))),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function updateStatus(id: string, input: UpdateDriverStatusInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<DriverDto> {
  const driver = await driverRepository.findById(id)
  if (!driver) throw ApiError.notFound('Driver not found')

  const previousStatus = driver.status
  const updated = await driverRepository.updateById(id, { status: input.status, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Driver not found')

  await auditService.record({
    actor,
    action: 'Driver Status Changed',
    entityType: 'Driver',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: input.status,
    ip: meta.ip,
  })

  return toDto(updated)
}

/**
 * The 1:1 driver<->vehicle assignment is kept consistent from this single
 * entry point — assigning a driver who already has a vehicle first frees
 * it, and stealing a vehicle already assigned to another driver first
 * frees that driver, so both sides can never point at a stale partner.
 */
async function assignVehicle(id: string, input: AssignVehicleInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<DriverDto> {
  const driver = await driverRepository.findById(id)
  if (!driver) throw ApiError.notFound('Driver not found')

  if (driver.assignedVehicleId) {
    await vehicleRepository.updateById(driver.assignedVehicleId.toString(), { assignedDriverId: null, updatedBy: toObjectId(actor.id) })
  }

  let vehicleId: string | null = null
  if (input.vehicleId) {
    const vehicle = await vehicleRepository.findById(input.vehicleId)
    if (!vehicle) throw ApiError.notFound('Vehicle not found')

    if (vehicle.assignedDriverId && vehicle.assignedDriverId.toString() !== id) {
      await driverRepository.updateById(vehicle.assignedDriverId.toString(), { assignedVehicleId: null, updatedBy: toObjectId(actor.id) })
    }

    await vehicleRepository.updateById(input.vehicleId, { assignedDriverId: toObjectId(id), updatedBy: toObjectId(actor.id) })
    vehicleId = input.vehicleId
  }

  const updated = await driverRepository.updateById(id, { assignedVehicleId: vehicleId ? toObjectId(vehicleId) : null, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Driver not found')

  await auditService.record({
    actor,
    action: 'Driver Vehicle Assignment Changed',
    entityType: 'Driver',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: driver.assignedVehicleId?.toString() ?? null,
    newValue: vehicleId,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function logTrip(id: string, input: LogTripInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<DriverDto> {
  const driver = await driverRepository.findById(id)
  if (!driver) throw ApiError.notFound('Driver not found')

  const updated = await driverRepository.updateById(id, {
    totalTripsCompleted: driver.totalTripsCompleted + 1,
    performanceRating: input.rating ?? driver.performanceRating,
    updatedBy: toObjectId(actor.id),
  })
  if (!updated) throw ApiError.notFound('Driver not found')

  await auditService.record({
    actor,
    action: 'Driver Trip Logged',
    entityType: 'Driver',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: String(driver.totalTripsCompleted),
    newValue: String(updated.totalTripsCompleted),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function softDelete(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<void> {
  const driver = await driverRepository.findById(id)
  if (!driver) throw ApiError.notFound('Driver not found')

  if (driver.status === 'On Trip') {
    throw ApiError.conflict('Cannot delete a driver who is currently on a trip')
  }

  const deleted = await driverRepository.softDeleteById(id)
  if (!deleted) throw ApiError.notFound('Driver not found')

  await auditService.record({
    actor,
    action: 'Driver Deleted',
    entityType: 'Driver',
    entityId: id,
    affectedRecord: describe(driver),
    previousValue: 'Active record',
    newValue: 'Soft-deleted',
    ip: meta.ip,
  })
}

async function restore(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<DriverDto> {
  const driver = await driverRepository.findDeletedById(id)
  if (!driver) throw ApiError.notFound('No deleted driver found with this id')

  const restored = await driverRepository.restoreById(id)
  if (!restored) throw ApiError.notFound('Driver not found')

  await auditService.record({
    actor,
    action: 'Driver Restored',
    entityType: 'Driver',
    entityId: id,
    affectedRecord: describe(restored),
    previousValue: 'Soft-deleted',
    newValue: 'Active record',
    ip: meta.ip,
  })

  return toDto(restored)
}

export const driverService = {
  create,
  getById,
  list,
  update,
  updateStatus,
  assignVehicle,
  logTrip,
  softDelete,
  restore,
}
