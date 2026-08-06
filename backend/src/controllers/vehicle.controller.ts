import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { vehicleService, type RequestMeta } from '../services/vehicle.service'
import type {
  CreateVehicleInput,
  LogFuelInput,
  LogMaintenanceInput,
  UpdateVehicleInput,
  UpdateVehicleStatusInput,
  VehicleListQuery,
} from '../validators/vehicle.validators'
import type { PaginationInput } from '../utils/pagination'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateVehicleInput
  const vehicle = await vehicleService.create(body, req.user!, requestMeta(req))
  ApiResponse.created(res, vehicle, 'Vehicle created')
})

export const listVehicles = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as VehicleListQuery
  const { data, meta } = await vehicleService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getVehicleStatsSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await vehicleService.getStatsSummary()
  ApiResponse.ok(res, summary)
})

export const getVehicleById = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.getById(paramId(req))
  ApiResponse.ok(res, vehicle)
})

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateVehicleInput
  const vehicle = await vehicleService.update(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, vehicle, 'Vehicle updated')
})

export const updateVehicleStatus = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateVehicleStatusInput
  const vehicle = await vehicleService.updateStatus(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, vehicle, 'Vehicle status updated')
})

export const logVehicleMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LogMaintenanceInput
  const record = await vehicleService.logMaintenance(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.created(res, record, 'Maintenance logged')
})

export const getVehicleMaintenanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as PaginationInput
  const { data, meta } = await vehicleService.getMaintenanceHistory(paramId(req), query)
  ApiResponse.paginated(res, data, meta)
})

export const logVehicleFuel = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LogFuelInput
  const record = await vehicleService.logFuel(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.created(res, record, 'Fuel record logged')
})

export const getVehicleFuelHistory = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as PaginationInput
  const { data, meta } = await vehicleService.getFuelHistory(paramId(req), query)
  ApiResponse.paginated(res, data, meta)
})

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  await vehicleService.softDelete(paramId(req), req.user!, requestMeta(req))
  ApiResponse.noContent(res)
})

export const restoreVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await vehicleService.restore(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, vehicle, 'Vehicle restored')
})
