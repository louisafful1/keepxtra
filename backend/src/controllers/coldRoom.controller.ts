import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { coldRoomService, type RequestMeta } from '../services/coldRoom.service'
import type {
  AdjustOccupancyInput,
  ColdRoomListQuery,
  CreateColdRoomInput,
  RecordReadingInput,
  UpdateColdRoomInput,
  UpdateColdRoomStatusInput,
} from '../validators/coldRoom.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const createColdRoom = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateColdRoomInput
  const coldRoom = await coldRoomService.create(body, req.user!, requestMeta(req))
  ApiResponse.created(res, coldRoom, 'Cold room created')
})

export const listColdRooms = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ColdRoomListQuery
  const { data, meta } = await coldRoomService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getColdRoomStatsSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await coldRoomService.getStatsSummary()
  ApiResponse.ok(res, summary)
})

export const getColdRoomById = asyncHandler(async (req: Request, res: Response) => {
  const coldRoom = await coldRoomService.getById(paramId(req))
  ApiResponse.ok(res, coldRoom)
})

export const updateColdRoom = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateColdRoomInput
  const coldRoom = await coldRoomService.update(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, coldRoom, 'Cold room updated')
})

export const updateColdRoomStatus = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateColdRoomStatusInput
  const coldRoom = await coldRoomService.updateStatus(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, coldRoom, 'Cold room status updated')
})

export const recordColdRoomReading = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RecordReadingInput
  const coldRoom = await coldRoomService.recordReading(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, coldRoom, 'Reading recorded')
})

export const adjustColdRoomOccupancy = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as AdjustOccupancyInput
  const coldRoom = await coldRoomService.adjustOccupancy(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, coldRoom, 'Occupancy updated')
})

export const deleteColdRoom = asyncHandler(async (req: Request, res: Response) => {
  await coldRoomService.softDelete(paramId(req), req.user!, requestMeta(req))
  ApiResponse.noContent(res)
})

export const restoreColdRoom = asyncHandler(async (req: Request, res: Response) => {
  const coldRoom = await coldRoomService.restore(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, coldRoom, 'Cold room restored')
})
