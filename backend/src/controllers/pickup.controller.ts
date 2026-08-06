import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { pickupService, type RequestMeta } from '../services/pickup.service'
import type {
  CancelPickupInput,
  CollectPickupInput,
  PickupListQuery,
  SchedulePickupInput,
  UpdateRouteNotesInput,
} from '../validators/pickup.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const listPickups = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as PickupListQuery
  const { data, meta } = await pickupService.list(query, req.user!)
  ApiResponse.paginated(res, data, meta)
})

export const getPickupById = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.getById(paramId(req), req.user!)
  ApiResponse.ok(res, pickup)
})

export const schedulePickup = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as SchedulePickupInput
  const pickup = await pickupService.schedule(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, pickup, 'Pickup scheduled')
})

export const startPickup = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.start(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, pickup, 'Pickup marked en route')
})

export const arrivePickup = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.arrive(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, pickup, 'Pickup marked arrived')
})

export const collectPickup = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CollectPickupInput
  const pickup = await pickupService.collect(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, pickup, 'Collection confirmed')
})

export const completePickup = asyncHandler(async (req: Request, res: Response) => {
  const pickup = await pickupService.complete(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, pickup, 'Pickup completed')
})

export const cancelPickup = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CancelPickupInput
  const pickup = await pickupService.cancel(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, pickup, 'Pickup cancelled')
})

export const updatePickupRouteNotes = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateRouteNotesInput
  const pickup = await pickupService.updateRouteNotes(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, pickup, 'Route notes updated')
})
