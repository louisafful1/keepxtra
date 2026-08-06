import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { warehouseService, type RequestMeta } from '../services/warehouse.service'
import type {
  AdjustOccupancyInput,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  UpdateWarehouseStatusInput,
  WarehouseListQuery,
} from '../validators/warehouse.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const createWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateWarehouseInput
  const warehouse = await warehouseService.create(body, req.user!, requestMeta(req))
  ApiResponse.created(res, warehouse, 'Warehouse created')
})

export const listWarehouses = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as WarehouseListQuery
  const { data, meta } = await warehouseService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getWarehouseStatsSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await warehouseService.getStatsSummary()
  ApiResponse.ok(res, summary)
})

export const getWarehouseById = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await warehouseService.getById(paramId(req))
  ApiResponse.ok(res, warehouse)
})

export const getWarehouseStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await warehouseService.getStats(paramId(req))
  ApiResponse.ok(res, stats)
})

export const updateWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateWarehouseInput
  const warehouse = await warehouseService.update(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, warehouse, 'Warehouse updated')
})

export const updateWarehouseStatus = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateWarehouseStatusInput
  const warehouse = await warehouseService.updateStatus(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, warehouse, 'Warehouse status updated')
})

export const adjustWarehouseOccupancy = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as AdjustOccupancyInput
  const warehouse = await warehouseService.adjustOccupancy(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, warehouse, 'Occupancy updated')
})

export const deleteWarehouse = asyncHandler(async (req: Request, res: Response) => {
  await warehouseService.softDelete(paramId(req), req.user!, requestMeta(req))
  ApiResponse.noContent(res)
})

export const restoreWarehouse = asyncHandler(async (req: Request, res: Response) => {
  const warehouse = await warehouseService.restore(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, warehouse, 'Warehouse restored')
})
