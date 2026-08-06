import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { driverService, type RequestMeta } from '../services/driver.service'
import type {
  AssignVehicleInput,
  CreateDriverInput,
  DriverListQuery,
  LogTripInput,
  UpdateDriverInput,
  UpdateDriverStatusInput,
} from '../validators/driver.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const createDriver = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateDriverInput
  const driver = await driverService.create(body, req.user!, requestMeta(req))
  ApiResponse.created(res, driver, 'Driver created')
})

export const listDrivers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as DriverListQuery
  const { data, meta } = await driverService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getDriverById = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverService.getById(paramId(req))
  ApiResponse.ok(res, driver)
})

export const updateDriver = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateDriverInput
  const driver = await driverService.update(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, driver, 'Driver updated')
})

export const updateDriverStatus = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateDriverStatusInput
  const driver = await driverService.updateStatus(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, driver, 'Driver status updated')
})

export const assignDriverVehicle = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as AssignVehicleInput
  const driver = await driverService.assignVehicle(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, driver, 'Vehicle assignment updated')
})

export const logDriverTrip = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as LogTripInput
  const driver = await driverService.logTrip(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, driver, 'Trip logged')
})

export const deleteDriver = asyncHandler(async (req: Request, res: Response) => {
  await driverService.softDelete(paramId(req), req.user!, requestMeta(req))
  ApiResponse.noContent(res)
})

export const restoreDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await driverService.restore(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, driver, 'Driver restored')
})
