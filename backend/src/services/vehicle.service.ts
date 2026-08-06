import { vehicleRepository } from '../repositories/vehicle.repository'
import { vehicleMaintenanceRecordRepository } from '../repositories/vehicleMaintenanceRecord.repository'
import { vehicleFuelRecordRepository } from '../repositories/vehicleFuelRecord.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta, type PaginationInput } from '../utils/pagination'
import type { IVehicle, VehicleStatus } from '../models/vehicle.model'
import type { IVehicleMaintenanceRecord } from '../models/vehicleMaintenanceRecord.model'
import type { IVehicleFuelRecord } from '../models/vehicleFuelRecord.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { FleetStatsSummaryDto, FuelRecordDto, MaintenanceRecordDto, VehicleDto } from '../types/vehicle.dto'
import type {
  CreateVehicleInput,
  LogFuelInput,
  LogMaintenanceInput,
  UpdateVehicleInput,
  UpdateVehicleStatusInput,
  VehicleListQuery,
} from '../validators/vehicle.validators'

export interface RequestMeta {
  ip?: string | null
}

const VEHICLE_STATUSES: VehicleStatus[] = ['Available', 'On Trip', 'Under Maintenance', 'Out of Service']

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function describe(vehicle: Pick<IVehicle, 'vehicleCode' | 'plateNumber'>): string {
  return `${vehicle.vehicleCode} (${vehicle.plateNumber})`
}

function toDto(vehicle: IVehicle): VehicleDto {
  return {
    id: vehicle._id.toString(),
    vehicleCode: vehicle.vehicleCode,
    plateNumber: vehicle.plateNumber,
    type: vehicle.type,
    make: vehicle.make,
    vehicleModel: vehicle.vehicleModel,
    year: vehicle.year,
    capacityKg: vehicle.capacityKg,
    fuelType: vehicle.fuelType,
    currentMileageKm: vehicle.currentMileageKm,
    status: vehicle.status,
    assignedDriverId: vehicle.assignedDriverId?.toString() ?? null,
    notes: vehicle.notes,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  }
}

function toMaintenanceDto(record: IVehicleMaintenanceRecord): MaintenanceRecordDto {
  return {
    id: record._id.toString(),
    vehicleId: record.vehicleId.toString(),
    type: record.type,
    description: record.description,
    costAmount: record.costAmount,
    odometerKm: record.odometerKm,
    performedAt: record.performedAt,
    performedBy: record.performedBy.toString(),
    createdAt: record.createdAt,
  }
}

function toFuelDto(record: IVehicleFuelRecord): FuelRecordDto {
  return {
    id: record._id.toString(),
    vehicleId: record.vehicleId.toString(),
    litres: record.litres,
    costAmount: record.costAmount,
    odometerKm: record.odometerKm,
    recordedAt: record.recordedAt,
    recordedBy: record.recordedBy.toString(),
    createdAt: record.createdAt,
  }
}

async function create(input: CreateVehicleInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<VehicleDto> {
  const vehicleCode = `VH-${String(await getNextSequenceValue('vehicle')).padStart(5, '0')}`

  const vehicle = await vehicleRepository.create({
    vehicleCode,
    plateNumber: input.plateNumber,
    type: input.type,
    make: input.make ?? null,
    vehicleModel: input.vehicleModel ?? null,
    year: input.year ?? null,
    capacityKg: input.capacityKg,
    fuelType: input.fuelType ?? null,
    notes: input.notes ?? null,
    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Vehicle Created',
    entityType: 'Vehicle',
    entityId: vehicle._id.toString(),
    affectedRecord: describe(vehicle),
    newValue: 'Available',
    ip: meta.ip,
  })

  return toDto(vehicle)
}

async function getById(id: string): Promise<VehicleDto> {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) throw ApiError.notFound('Vehicle not found')
  return toDto(vehicle)
}

async function list(query: VehicleListQuery): Promise<{ data: VehicleDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<IVehicle>({
    search: query,
    searchableFields: ['vehicleCode', 'plateNumber', 'type', 'make', 'vehicleModel'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, type: query.type },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    vehicleRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    vehicleRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function update(id: string, input: UpdateVehicleInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<VehicleDto> {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) throw ApiError.notFound('Vehicle not found')

  const changedKeys = Object.keys(input) as (keyof IVehicle)[]
  const before = vehicle as unknown as Record<string, unknown>

  const updated = await vehicleRepository.updateById(id, { ...input, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Vehicle not found')

  const after = updated as unknown as Record<string, unknown>
  await auditService.record({
    actor,
    action: 'Vehicle Updated',
    entityType: 'Vehicle',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, before[key]]))),
    newValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, after[key]]))),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function updateStatus(id: string, input: UpdateVehicleStatusInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<VehicleDto> {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) throw ApiError.notFound('Vehicle not found')

  const previousStatus = vehicle.status
  const updated = await vehicleRepository.updateById(id, { status: input.status, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Vehicle not found')

  await auditService.record({
    actor,
    action: 'Vehicle Status Changed',
    entityType: 'Vehicle',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: input.status,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function logMaintenance(id: string, input: LogMaintenanceInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<MaintenanceRecordDto> {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) throw ApiError.notFound('Vehicle not found')

  const record = await vehicleMaintenanceRecordRepository.create({
    vehicleId: vehicle._id,
    type: input.type,
    description: input.description,
    costAmount: input.costAmount ?? null,
    odometerKm: input.odometerKm ?? null,
    performedAt: input.performedAt,
    performedBy: toObjectId(actor.id),
  })

  if (input.odometerKm !== undefined && input.odometerKm > vehicle.currentMileageKm) {
    await vehicleRepository.updateById(id, { currentMileageKm: input.odometerKm, updatedBy: toObjectId(actor.id) })
  }

  await auditService.record({
    actor,
    action: 'Vehicle Maintenance Logged',
    entityType: 'Vehicle',
    entityId: id,
    affectedRecord: describe(vehicle),
    previousValue: null,
    newValue: `${input.type} — ${input.description}`,
    ip: meta.ip,
  })

  return toMaintenanceDto(record)
}

async function getMaintenanceHistory(id: string, query: PaginationInput): Promise<{ data: MaintenanceRecordDto[]; meta: PaginationMeta }> {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) throw ApiError.notFound('Vehicle not found')

  const pagination = resolvePagination(query)
  const [records, total] = await Promise.all([
    vehicleMaintenanceRecordRepository.findByVehicleId(id, { skip: pagination.skip, limit: pagination.limit }),
    vehicleMaintenanceRecordRepository.countByVehicleId(id),
  ])

  return { data: records.map(toMaintenanceDto), meta: buildPaginationMeta(total, pagination) }
}

async function logFuel(id: string, input: LogFuelInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<FuelRecordDto> {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) throw ApiError.notFound('Vehicle not found')

  const record = await vehicleFuelRecordRepository.create({
    vehicleId: vehicle._id,
    litres: input.litres,
    costAmount: input.costAmount,
    odometerKm: input.odometerKm,
    recordedAt: input.recordedAt,
    recordedBy: toObjectId(actor.id),
  })

  if (input.odometerKm > vehicle.currentMileageKm) {
    await vehicleRepository.updateById(id, { currentMileageKm: input.odometerKm, updatedBy: toObjectId(actor.id) })
  }

  await auditService.record({
    actor,
    action: 'Vehicle Fuel Logged',
    entityType: 'Vehicle',
    entityId: id,
    affectedRecord: describe(vehicle),
    previousValue: null,
    newValue: `${input.litres}L — ${input.costAmount}`,
    ip: meta.ip,
  })

  return toFuelDto(record)
}

async function getFuelHistory(id: string, query: PaginationInput): Promise<{ data: FuelRecordDto[]; meta: PaginationMeta }> {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) throw ApiError.notFound('Vehicle not found')

  const pagination = resolvePagination(query)
  const [records, total] = await Promise.all([
    vehicleFuelRecordRepository.findByVehicleId(id, { skip: pagination.skip, limit: pagination.limit }),
    vehicleFuelRecordRepository.countByVehicleId(id),
  ])

  return { data: records.map(toFuelDto), meta: buildPaginationMeta(total, pagination) }
}

async function softDelete(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<void> {
  const vehicle = await vehicleRepository.findById(id)
  if (!vehicle) throw ApiError.notFound('Vehicle not found')

  if (vehicle.status === 'On Trip') {
    throw ApiError.conflict('Cannot delete a vehicle that is currently on a trip')
  }

  const deleted = await vehicleRepository.softDeleteById(id)
  if (!deleted) throw ApiError.notFound('Vehicle not found')

  await auditService.record({
    actor,
    action: 'Vehicle Deleted',
    entityType: 'Vehicle',
    entityId: id,
    affectedRecord: describe(vehicle),
    previousValue: 'Active record',
    newValue: 'Soft-deleted',
    ip: meta.ip,
  })
}

async function restore(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<VehicleDto> {
  const vehicle = await vehicleRepository.findDeletedById(id)
  if (!vehicle) throw ApiError.notFound('No deleted vehicle found with this id')

  const restored = await vehicleRepository.restoreById(id)
  if (!restored) throw ApiError.notFound('Vehicle not found')

  await auditService.record({
    actor,
    action: 'Vehicle Restored',
    entityType: 'Vehicle',
    entityId: id,
    affectedRecord: describe(restored),
    previousValue: 'Soft-deleted',
    newValue: 'Active record',
    ip: meta.ip,
  })

  return toDto(restored)
}

async function getStatsSummary(): Promise<FleetStatsSummaryDto> {
  const vehicles = await vehicleRepository.findAllActive()

  const byVehicleStatus = VEHICLE_STATUSES.reduce((acc, status) => ({ ...acc, [status]: 0 }), {} as Record<VehicleStatus, number>)
  for (const vehicle of vehicles) byVehicleStatus[vehicle.status] += 1

  const totalCapacityKg = vehicles.reduce((sum, v) => sum + v.capacityKg, 0)
  const onTripCount = byVehicleStatus['On Trip']

  const [totalMaintenanceCostAmount, totalFuelCostAmount] = await Promise.all([
    vehicleMaintenanceRecordRepository.sumCostAmount(),
    vehicleFuelRecordRepository.sumCostAmount(),
  ])

  return {
    vehicleCount: vehicles.length,
    byVehicleStatus,
    totalCapacityKg,
    utilizationPercent: vehicles.length > 0 ? round2((onTripCount / vehicles.length) * 100) : 0,
    totalMaintenanceCostAmount: round2(totalMaintenanceCostAmount),
    totalFuelCostAmount: round2(totalFuelCostAmount),
  }
}

export const vehicleService = {
  create,
  getById,
  list,
  update,
  updateStatus,
  logMaintenance,
  getMaintenanceHistory,
  logFuel,
  getFuelHistory,
  softDelete,
  restore,
  getStatsSummary,
}
