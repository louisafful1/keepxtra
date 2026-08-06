import type { Request, Response } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { ApiResponse } from '../utils/ApiResponse'
import { customerService, type RequestMeta } from '../services/customer.service'
import type { CreateCustomerInput, CustomerListQuery, UpdateCustomerInput, UpdateCustomerStatusInput } from '../validators/customer.validators'

function requestMeta(req: Request): RequestMeta {
  return { ip: req.ip ?? null }
}

// Already validated as a well-formed ObjectId string by `mongoIdParamSchema` before any handler here runs.
function paramId(req: Request): string {
  return req.params.id as string
}

export const createCustomer = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as CreateCustomerInput
  const customer = await customerService.create(body, req.user!, requestMeta(req))
  ApiResponse.created(res, customer, 'Customer created')
})

export const listCustomers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as CustomerListQuery
  const { data, meta } = await customerService.list(query)
  ApiResponse.paginated(res, data, meta)
})

export const getCustomerById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getById(paramId(req))
  ApiResponse.ok(res, customer)
})

export const updateCustomer = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateCustomerInput
  const customer = await customerService.update(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, customer, 'Customer updated')
})

export const updateCustomerStatus = asyncHandler(async (req: Request, res: Response) => {
  const body = req.body as UpdateCustomerStatusInput
  const customer = await customerService.updateStatus(paramId(req), body, req.user!, requestMeta(req))
  ApiResponse.ok(res, customer, 'Customer status updated')
})

export const deleteCustomer = asyncHandler(async (req: Request, res: Response) => {
  await customerService.softDelete(paramId(req), req.user!, requestMeta(req))
  ApiResponse.noContent(res)
})

export const restoreCustomer = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.restore(paramId(req), req.user!, requestMeta(req))
  ApiResponse.ok(res, customer, 'Customer restored')
})
