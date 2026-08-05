import type { Document, QueryFilter, Model } from 'mongoose'
import type { FindManyOptions, IRepository } from '../interfaces/repository.interface'

type SoftDeletable = Document & { isDeleted: boolean; deletedAt: Date | null }

/**
 * Generic CRUD repository over a Mongoose model. This is the ONLY layer
 * allowed to import a Mongoose model directly (see the SAD's layering
 * rule) — services depend on `IRepository`, never on Mongoose types, so a
 * future caching layer or data-store change is invisible to business logic.
 *
 * Every read here defaults to excluding soft-deleted documents; pass
 * `includeDeleted: true` in `FindManyOptions.filter` (as `{ isDeleted: {$in:[true,false]} }`)
 * or query the model directly for the rare admin "show deleted" view.
 */
export class BaseRepository<T extends SoftDeletable, CreateInput = Partial<T>, UpdateInput = Partial<T>>
  implements IRepository<T, CreateInput, UpdateInput>
{
  constructor(protected readonly model: Model<T>) {}

  private notDeleted(filter: QueryFilter<T> = {}): QueryFilter<T> {
    return { ...filter, isDeleted: false }
  }

  async findById(id: string, populate?: string | string[]): Promise<T | null> {
    let query = this.model.findOne(this.notDeleted({ _id: id }))
    if (populate) query = query.populate(populate)
    return query.exec()
  }

  async findOne(filter: QueryFilter<T>, populate?: string | string[]): Promise<T | null> {
    let query = this.model.findOne(this.notDeleted(filter))
    if (populate) query = query.populate(populate)
    return query.exec()
  }

  async findMany({ filter = {}, sort, skip, limit, populate }: FindManyOptions<T>): Promise<T[]> {
    let query = this.model.find(this.notDeleted(filter))
    if (sort) query = query.sort(sort)
    if (typeof skip === 'number') query = query.skip(skip)
    if (typeof limit === 'number') query = query.limit(limit)
    if (populate) query = query.populate(populate)
    return query.exec()
  }

  async count(filter: QueryFilter<T> = {}): Promise<number> {
    return this.model.countDocuments(this.notDeleted(filter)).exec()
  }

  async create(input: CreateInput): Promise<T> {
    const doc = new this.model(input as Partial<T>)
    return doc.save()
  }

  async updateById(id: string, input: UpdateInput): Promise<T | null> {
    return this.model
      .findOneAndUpdate(this.notDeleted({ _id: id }), { $set: input as Partial<T> }, { returnDocument: 'after', runValidators: true })
      .exec()
  }

  async softDeleteById(id: string): Promise<T | null> {
    return this.model
      .findOneAndUpdate(
        this.notDeleted({ _id: id }),
        { $set: { isDeleted: true, deletedAt: new Date() } },
        { returnDocument: 'after' },
      )
      .exec()
  }
}
