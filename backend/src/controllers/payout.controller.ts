import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { payoutService, type RequestMeta } from '../services/payout.service'
import type { PayoutListQuery, ProcessPayoutInput, RejectPayoutInput } from '../validators/payout.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const listPayouts = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as PayoutListQuery
  const { data, meta } = await payoutService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getPayoutStatsSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await payoutService.getStatsSummary()
  ApiResponse.ok(res, summary)
})

export const getFarmerPayoutSummary = asyncHandler(async (req: Request, res: Response) => {
  const summary = await payoutService.getFarmerSummary(req.params.farmerId as string)
  ApiResponse.ok(res, summary)
})

export const getPayoutById = asyncHandler(async (req: Request, res: Response) => {
  const payout = await payoutService.getById(paramId(req))
  ApiResponse.ok(res, payout)
})

export const approvePayout = asyncHandler(async (req: Request, res: Response) => {
  const payout = await payoutService.approve(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, payout, 'Payout approved')
})

export const processPayout = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as ProcessPayoutInput
  const payout = await payoutService.process(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, payout, 'Payout processed')
})

export const rejectPayout = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as RejectPayoutInput
  const payout = await payoutService.reject(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, payout, 'Payout rejected')
})
