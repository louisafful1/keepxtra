import { VehicleFuelRecord, type IVehicleFuelRecord } from '../models/vehicleFuelRecord.model'
import type { Types } from 'mongoose'

export interface CreateFuelRecordInput {
  vehicleId: Types.ObjectId
  litres: number
  costAmount: number
  odometerKm: number
  recordedAt: Date
  recordedBy: Types.ObjectId
}

/** Not a `BaseRepository` subclass — an append-only ledger with no soft-delete concept, mirroring `InventoryMovementRepository`. */
export class VehicleFuelRecordRepository {
  async create(input: CreateFuelRecordInput): Promise<IVehicleFuelRecord> {
    return VehicleFuelRecord.create(input)
  }

  async findByVehicleId(vehicleId: string, options: { skip: number; limit: number }): Promise<IVehicleFuelRecord[]> {
    return VehicleFuelRecord.find({ vehicleId }).sort({ recordedAt: -1 }).skip(options.skip).limit(options.limit).exec()
  }

  async countByVehicleId(vehicleId: string): Promise<number> {
    return VehicleFuelRecord.countDocuments({ vehicleId }).exec()
  }

  /** For the fleet stats summary — small enough to sum via aggregation rather than pulling every document into memory. */
  async sumCostAmount(): Promise<number> {
    const [result] = await VehicleFuelRecord.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: '$costAmount' } } }]).exec()
    return result?.total ?? 0
  }
}

export const vehicleFuelRecordRepository = new VehicleFuelRecordRepository()
