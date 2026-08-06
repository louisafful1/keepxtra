import { customerRepository } from '../repositories/customer.repository'
import { auditService } from './audit.service'
import { getNextSequenceValue } from '../utils/counter'
import { toObjectId } from '../utils/mongoose'
import { ApiError } from '../utils/ApiError'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import type { ICustomer } from '../models/customer.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { CustomerDto } from '../types/customer.dto'
import type { CreateCustomerInput, CustomerListQuery, UpdateCustomerInput, UpdateCustomerStatusInput } from '../validators/customer.validators'

export interface RequestMeta {
  ip?: string | null
}

function describe(customer: Pick<ICustomer, 'customerCode' | 'name'>): string {
  return `${customer.customerCode} (${customer.name})`
}

function toDto(customer: ICustomer): CustomerDto {
  return {
    id: customer._id.toString(),
    customerCode: customer.customerCode,
    name: customer.name,
    type: customer.type,
    contactPerson: customer.contactPerson,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    status: customer.status,
    notes: customer.notes,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
  }
}

async function create(input: CreateCustomerInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<CustomerDto> {
  const customerCode = `CUS-${String(await getNextSequenceValue('customer')).padStart(5, '0')}`

  const customer = await customerRepository.create({
    customerCode,
    name: input.name,
    type: input.type,
    contactPerson: input.contactPerson ?? null,
    phone: input.phone,
    email: input.email ?? null,
    address: input.address,
    notes: input.notes ?? null,
    createdBy: toObjectId(actor.id),
  })

  await auditService.record({
    actor,
    action: 'Customer Created',
    entityType: 'Customer',
    entityId: customer._id.toString(),
    affectedRecord: describe(customer),
    newValue: 'Active',
    ip: meta.ip,
  })

  return toDto(customer)
}

async function getById(id: string): Promise<CustomerDto> {
  const customer = await customerRepository.findById(id)
  if (!customer) throw ApiError.notFound('Customer not found')
  return toDto(customer)
}

async function list(query: CustomerListQuery): Promise<{ data: CustomerDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<ICustomer>({
    search: query,
    searchableFields: ['customerCode', 'name', 'phone', 'email', 'contactPerson'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, type: query.type },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    customerRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    customerRepository.count(filter),
  ])

  return { data: records.map(toDto), meta: buildPaginationMeta(total, pagination) }
}

async function update(id: string, input: UpdateCustomerInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<CustomerDto> {
  const customer = await customerRepository.findById(id)
  if (!customer) throw ApiError.notFound('Customer not found')

  const changedKeys = Object.keys(input) as (keyof ICustomer)[]
  const before = customer as unknown as Record<string, unknown>

  const updated = await customerRepository.updateById(id, { ...input, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Customer not found')

  const after = updated as unknown as Record<string, unknown>
  await auditService.record({
    actor,
    action: 'Customer Updated',
    entityType: 'Customer',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, before[key]]))),
    newValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, after[key]]))),
    ip: meta.ip,
  })

  return toDto(updated)
}

async function updateStatus(id: string, input: UpdateCustomerStatusInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<CustomerDto> {
  const customer = await customerRepository.findById(id)
  if (!customer) throw ApiError.notFound('Customer not found')

  const previousStatus = customer.status
  const updated = await customerRepository.updateById(id, { status: input.status, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Customer not found')

  await auditService.record({
    actor,
    action: 'Customer Status Changed',
    entityType: 'Customer',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: input.status,
    ip: meta.ip,
  })

  return toDto(updated)
}

async function softDelete(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<void> {
  const customer = await customerRepository.findById(id)
  if (!customer) throw ApiError.notFound('Customer not found')

  const deleted = await customerRepository.softDeleteById(id)
  if (!deleted) throw ApiError.notFound('Customer not found')

  await auditService.record({
    actor,
    action: 'Customer Deleted',
    entityType: 'Customer',
    entityId: id,
    affectedRecord: describe(customer),
    previousValue: 'Active record',
    newValue: 'Soft-deleted',
    ip: meta.ip,
  })
}

async function restore(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<CustomerDto> {
  const customer = await customerRepository.findDeletedById(id)
  if (!customer) throw ApiError.notFound('No deleted customer found with this id')

  const restored = await customerRepository.restoreById(id)
  if (!restored) throw ApiError.notFound('Customer not found')

  await auditService.record({
    actor,
    action: 'Customer Restored',
    entityType: 'Customer',
    entityId: id,
    affectedRecord: describe(restored),
    previousValue: 'Soft-deleted',
    newValue: 'Active record',
    ip: meta.ip,
  })

  return toDto(restored)
}

export const customerService = {
  create,
  getById,
  list,
  update,
  updateStatus,
  softDelete,
  restore,
}
