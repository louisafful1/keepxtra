import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { farmerService, type RequestMeta } from '../services/farmer.service'
import type { CreateFarmerInput, FarmerListQuery, UpdateFarmerInput, UpdateFarmerStatusInput } from '../validators/farmer.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema`
// before any handler here runs — the cast just satisfies Express's params
// type, which allows repeated-segment values (`string | string[]`).
function paramId(req: Request): string {
  return req.params.id as string
}

export const registerFarmer = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateFarmerInput
  const farmer = await farmerService.register(body, req.user!, requestMeta(req))
  ApiResponse.created(res, farmer, 'Farmer registered successfully')
})

export const listFarmers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as FarmerListQuery
  const { data, meta } = await farmerService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getMyFarmerProfile = asyncHandler(async (req: Request, res: Response) => {
  const farmer = await farmerService.getMyProfile(req.user!)
  ApiResponse.ok(res, farmer)
})

export const getFarmerById = asyncHandler(async (req: Request, res: Response) => {
  const farmer = await farmerService.getById(paramId(req), req.user!)
  ApiResponse.ok(res, farmer)
})

export const updateFarmer = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateFarmerInput
  const farmer = await farmerService.update(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, farmer, 'Farmer updated successfully')
})

export const updateFarmerStatus = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateFarmerStatusInput
  const farmer = await farmerService.updateStatus(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, farmer, `Farmer marked ${body.status.toLowerCase()}`)
})

export const deleteFarmer = asyncHandler(async (req: Request, res: Response) => {
  await farmerService.softDelete(paramId(req), req.user!, requestMeta(req))
  ApiResponse.noContent(res)
})

export const restoreFarmer = asyncHandler(async (req: Request, res: Response) => {
  const farmer = await farmerService.restore(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, farmer, 'Farmer restored successfully')
})
