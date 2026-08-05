import type { PaginationMeta } from '../utils/pagination'

export interface ApiSuccessBody<T> {
  success: true
  message?: string
  data: T
}

export interface ApiPaginatedBody<T> {
  success: true
  message?: string
  data: T[]
  meta: PaginationMeta
}

export interface ApiErrorBody {
  success: false
  error: {
    message: string
    code: string
    details?: unknown
    requestId?: string
  }
}

/** Base fields present on every document per the SAD's audit/soft-delete convention. */
export interface AuditedDocument {
  createdAt: Date
  updatedAt: Date
  createdBy?: string
  updatedBy?: string
  isDeleted: boolean
  deletedAt?: Date | null
}
