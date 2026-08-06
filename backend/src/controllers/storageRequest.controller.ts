import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { storageRequestService, type RequestMeta } from '../services/storageRequest.service'
import type {
  CancelStorageRequestInput,
  CreateStorageRequestInput,
  RejectStorageRequestInput,
  StorageRequestListQuery,
  UpdateInternalNotesInput,
  UpdatePriorityInput,
  UpdateStorageRequestInput,
} from '../validators/storageRequest.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema`
// before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const createStorageRequest = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateStorageRequestInput
  const request = await storageRequestService.create(body, req.user!, requestMeta(req))
  ApiResponse.created(res, request, 'Storage request created')
})

export const listStorageRequests = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as StorageRequestListQuery
  const { data, meta } = await storageRequestService.list(query, req.user!)
  ApiResponse.paginated(res, data, meta)
})

export const getStorageRequestById = asyncHandler(async (req: Request, res: Response) => {
  const request = await storageRequestService.getById(paramId(req), req.user!)
  ApiResponse.ok(res, request)
})

export const updateStorageRequest = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateStorageRequestInput
  const request = await storageRequestService.update(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, request, 'Storage request updated')
})

export const submitStorageRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await storageRequestService.submit(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, request, 'Storage request submitted')
})

export const approveStorageRequest = asyncHandler(async (req: Request, res: Response) => {
  const request = await storageRequestService.approve(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, request, 'Storage request approved')
})

export const rejectStorageRequest = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RejectStorageRequestInput
  const request = await storageRequestService.reject(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, request, 'Storage request rejected')
})

export const cancelStorageRequest = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CancelStorageRequestInput
  const request = await storageRequestService.cancel(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, request, 'Storage request cancelled')
})

export const updateStorageRequestPriority = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdatePriorityInput
  const request = await storageRequestService.updatePriority(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, request, 'Priority updated')
})

export const updateStorageRequestInternalNotes = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateInternalNotesInput
  const request = await storageRequestService.updateInternalNotes(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, request, 'Internal notes updated')
})
