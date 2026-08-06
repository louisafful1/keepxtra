import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { inventoryService, type RequestMeta } from '../services/inventory.service'
import type {
  AdjustInventoryInput,
  DisposeInventoryInput,
  InventoryListQuery,
  MovementListQuery,
  ReceiveInventoryInput,
  TransferInventoryInput,
} from '../validators/inventory.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const listInventory = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as InventoryListQuery
  const { data, meta } = await inventoryService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getInventoryIntelligenceSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await inventoryService.getIntelligenceSummary()
  ApiResponse.ok(res, summary)
})

export const getInventoryById = asyncHandler(async (req: Request, res: Response) => {
  const inventory = await inventoryService.getById(paramId(req))
  ApiResponse.ok(res, inventory)
})

export const getInventoryMovements = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as MovementListQuery
  const { data, meta } = await inventoryService.getMovements(paramId(req), query)
  ApiResponse.paginated(res, data, meta)
})

export const receiveInventory = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ReceiveInventoryInput
  const inventory = await inventoryService.receive(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, inventory, 'Inventory received')
})

export const adjustInventory = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as AdjustInventoryInput
  const inventory = await inventoryService.adjust(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, inventory, 'Inventory adjusted')
})

export const transferInventory = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as TransferInventoryInput
  const inventory = await inventoryService.transfer(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, inventory, 'Inventory transferred')
})

export const disposeInventory = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as DisposeInventoryInput
  const inventory = await inventoryService.dispose(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, inventory, 'Inventory disposed')
})
