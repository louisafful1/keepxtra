import { VehicleMaintenanceRecord, type IVehicleMaintenanceRecord, type MaintenanceType } from '../models/vehicleMaintenanceRecord.model'
import type { Types } from 'mongoose'

export interface CreateMaintenanceRecordInput {
  vehicleId: Types.ObjectId
  type: MaintenanceType
  description: string
  costAmount?: number | null
  odometerKm?: number | null
  performedAt: Date
  performedBy: Types.ObjectId
}

/** Not a `BaseRepository` subclass — an append-only ledger with no soft-delete concept, mirroring `InventoryMovementRepository`. */
export class VehicleMaintenanceRecordRepository {
  async create(input: CreateMaintenanceRecordInput): Promise<IVehicleMaintenanceRecord> {
    return VehicleMaintenanceRecord.create(input)
  }

  async findByVehicleId(vehicleId: string, options: { skip: number; limit: number }): Promise<IVehicleMaintenanceRecord[]> {
    return VehicleMaintenanceRecord.find({ vehicleId }).sort({ performedAt: -1 }).skip(options.skip).limit(options.limit).exec()
  }

  async countByVehicleId(vehicleId: string): Promise<number> {
    return VehicleMaintenanceRecord.countDocuments({ vehicleId }).exec()
  }

  /** For the fleet stats summary — small enough to sum via aggregation rather than pulling every document into memory. */
  async sumCostAmount(): Promise<number> {
    const [result] = await VehicleMaintenanceRecord.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: '$costAmount' } } }]).exec()
    return result?.total ?? 0
  }
}

export const vehicleMaintenanceRecordRepository = new VehicleMaintenanceRecordRepository()
