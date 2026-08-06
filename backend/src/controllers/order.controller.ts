import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { orderService, type RequestMeta } from '../services/order.service'
import type { CancelOrderInput, CreateOrderInput, OrderListQuery, UpdateOrderInput } from '../validators/order.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateOrderInput
  const order = await orderService.create(body, req.user!, requestMeta(req))
  ApiResponse.created(res, order, 'Order created')
})

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as OrderListQuery
  const { data, meta } = await orderService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getOrderStatsSummary = asyncHandler(async (_req: Request, res: Response) => {
  const summary = await orderService.getStatsSummary()
  ApiResponse.ok(res, summary)
})

export const getOrderById = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.getById(paramId(req))
  ApiResponse.ok(res, order)
})

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateOrderInput
  const order = await orderService.update(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, order, 'Order updated')
})

export const confirmOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.confirm(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, order, 'Order confirmed')
})

export const deliverOrder = asyncHandler(async (req: Request, res: Response) => {
  const order = await orderService.deliver(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, order, 'Order delivered')
})

export const cancelOrder = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CancelOrderInput
  const order = await orderService.cancel(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, order, 'Order cancelled')
})
