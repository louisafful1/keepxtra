import type { QueryFilter, SortOrder } from 'mongoose'

export interface FindManyOptions<T> {
  filter?: QueryFilter<T>
  sort?: Record<string, SortOrder>
  skip?: number
  limit?: number
  populate?: string | string[]
}

/**
 * The contract every repository in `repositories/` implements. Services
 * depend on this interface rather than a concrete Mongoose model, so the
 * data-access layer (and, later, a caching layer in front of it) can change
 * without touching business logic.
 */
export interface IRepository<T, CreateInput = Partial<T>, UpdateInput = Partial<T>> {
  findById(id: string, populate?: string | string[]): Promise<T | null>
  findOne(filter: QueryFilter<T>, populate?: string | string[]): Promise<T | null>
  findMany(options: FindManyOptions<T>): Promise<T[]>
  count(filter: QueryFilter<T>): Promise<number>
  create(input: CreateInput): Promise<T>
  updateById(id: string, input: UpdateInput): Promise<T | null>
  softDeleteById(id: string): Promise<T | null>
}
