import { Types } from 'mongoose'
import { farmerRepository } from '../repositories/farmer.repository'
import { userRepository } from '../repositories/user.repository'
import { roleRepository } from '../repositories/role.repository'
import { passwordResetTokenRepository } from '../repositories/passwordResetToken.repository'
import { mailService } from './mail.service'
import { auditService } from './audit.service'
import { hashPassword } from '../utils/password'
import { generateOpaqueToken, hashToken } from '../utils/crypto'
import { getNextSequenceValue } from '../utils/counter'
import { ApiError } from '../utils/ApiError'
import { env } from '../config/env'
import { PASSWORD_RESET_TOKEN_TTL_MS } from '../constants/auth'
import { buildFilterQuery, buildSort } from '../utils/queryBuilder'
import { resolvePagination, buildPaginationMeta, type PaginationMeta } from '../utils/pagination'
import type { IFarmer } from '../models/farmer.model'
import type { IRole } from '../models/role.model'
import type { AuthenticatedUser } from '../interfaces/auth.interface'
import type { FarmerDto } from '../types/farmer.dto'
import type { CreateFarmerInput, FarmerListQuery, UpdateFarmerInput, UpdateFarmerStatusInput } from '../validators/farmer.validators'

export interface RequestMeta {
  ip?: string | null
}

const FARMER_ROLE_NAME = 'Farmer'

/**
 * There is no seed script yet (see the SAD's cutover notes), so the
 * `Farmer` role is created lazily the first time it's needed rather than
 * assumed to already exist in the database.
 */
async function ensureFarmerRole(): Promise<IRole> {
  const existing = await roleRepository.findByName(FARMER_ROLE_NAME)
  if (existing) return existing

  return roleRepository.create({
    name: FARMER_ROLE_NAME,
    scope: 'farmer',
    description: 'Farmer portal access — scoped to their own data.',
    permissions: [],
    isSystem: true,
  })
}

function toFarmerDto(farmer: IFarmer): FarmerDto {
  return {
    id: farmer._id.toString(),
    userId: farmer.userId.toString(),
    farmerNumber: farmer.farmerNumber,
    firstName: farmer.firstName,
    lastName: farmer.lastName,
    fullName: `${farmer.firstName} ${farmer.lastName}`,
    phone: farmer.phone,
    alternativePhone: farmer.alternativePhone,
    email: farmer.email,
    nationalId: farmer.nationalId,
    farmName: farmer.farmName,
    farmLocation: farmer.farmLocation,
    district: farmer.district,
    region: farmer.region,
    gpsCoordinates: farmer.gpsCoordinates,
    primaryCrops: farmer.primaryCrops,
    preferredPickupDays: farmer.preferredPickupDays,
    preferredPaymentMethod: farmer.preferredPaymentMethod,
    bankDetails: farmer.bankDetails,
    mobileMoneyDetails: farmer.mobileMoneyDetails,
    status: farmer.status,
    notes: farmer.notes,
    createdAt: farmer.createdAt,
    updatedAt: farmer.updatedAt,
  }
}

function describe(farmer: Pick<IFarmer, 'farmerNumber' | 'firstName' | 'lastName'>): string {
  return `${farmer.farmerNumber} (${farmer.firstName} ${farmer.lastName})`
}

/** `actor.id` is a plain string (see `AuthenticatedUser`); Mongoose's schema types expect a real ObjectId for ref fields. */
function toObjectId(id: string): Types.ObjectId {
  return new Types.ObjectId(id)
}

function isOwner(farmer: IFarmer, actor: AuthenticatedUser): boolean {
  return farmer.userId.toString() === actor.id
}

function assertCanManage(actor: AuthenticatedUser, permission: 'farmers.read' | 'farmers.update' | 'farmers.delete') {
  if (!actor.permissions.includes(permission)) throw ApiError.forbidden('You do not have permission to perform this action')
}

async function register(input: CreateFarmerInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<FarmerDto> {
  const duplicate = await farmerRepository.findPotentialDuplicate(input.phone, input.email)
  if (duplicate) throw ApiError.conflict('A farmer with this phone number or email is already registered')

  const existingUser = await userRepository.findByEmail(input.email)
  if (existingUser) throw ApiError.conflict('A user account with this email already exists')

  const role = await ensureFarmerRole()

  const user = await userRepository.create({
    name: `${input.firstName} ${input.lastName}`,
    email: input.email,
    passwordHash: await hashPassword(generateOpaqueToken()),
    roleId: role._id,
    avatarInitials: `${input.firstName[0]}${input.lastName[0]}`.toUpperCase(),
    phone: input.phone,
    status: 'Pending Review',
    createdBy: toObjectId(actor.id),
  })

  const farmerNumber = `FRM-${String(await getNextSequenceValue('farmer')).padStart(5, '0')}`

  const farmer = await farmerRepository.create({
    userId: user._id,
    farmerNumber,
    firstName: input.firstName,
    lastName: input.lastName,
    phone: input.phone,
    alternativePhone: input.alternativePhone ?? null,
    email: input.email,
    nationalId: input.nationalId ?? null,
    farmName: input.farmName,
    farmLocation: input.farmLocation,
    district: input.district,
    region: input.region,
    gpsCoordinates: input.gpsCoordinates ?? null,
    primaryCrops: input.primaryCrops,
    preferredPickupDays: input.preferredPickupDays ?? [],
    preferredPaymentMethod: input.preferredPaymentMethod,
    bankDetails: input.bankDetails ?? null,
    mobileMoneyDetails: input.mobileMoneyDetails ?? null,
    notes: input.notes ?? null,
    createdBy: toObjectId(actor.id),
  })

  // Reuses the Phase 2 password-reset mechanism unchanged as a "set your
  // password" welcome flow — a fresh account has no password to reset yet,
  // but the token lifecycle (single-use, expiring, hashed at rest) is
  // identical, so there's no reason to build a parallel one.
  const rawToken = generateOpaqueToken()
  await passwordResetTokenRepository.create(user._id.toString(), hashToken(rawToken), new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS))
  const setPasswordUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`
  await mailService.sendPasswordResetEmail(user.email, setPasswordUrl)

  await auditService.record({
    actor,
    action: 'Farmer Created',
    entityType: 'Farmer',
    entityId: farmer._id.toString(),
    affectedRecord: describe(farmer),
    newValue: 'Active',
    ip: meta.ip,
  })

  return toFarmerDto(farmer)
}

async function getById(id: string, actor: AuthenticatedUser): Promise<FarmerDto> {
  const farmer = await farmerRepository.findById(id)
  if (!farmer) throw ApiError.notFound('Farmer not found')

  if (!actor.permissions.includes('farmers.read') && !isOwner(farmer, actor)) {
    throw ApiError.forbidden('You do not have permission to view this farmer')
  }

  return toFarmerDto(farmer)
}

async function getMyProfile(actor: AuthenticatedUser): Promise<FarmerDto> {
  const farmer = await farmerRepository.findByUserId(actor.id)
  if (!farmer) throw ApiError.notFound('No farmer profile is linked to this account')
  return toFarmerDto(farmer)
}

async function list(query: FarmerListQuery): Promise<{ data: FarmerDto[]; meta: PaginationMeta }> {
  const pagination = resolvePagination(query)
  const filter = buildFilterQuery<IFarmer>({
    search: query,
    searchableFields: ['farmerNumber', 'firstName', 'lastName', 'phone', 'email', 'farmName', 'district', 'region'],
    dateField: 'createdAt',
    dateRange: query,
    equality: { status: query.status, region: query.region, district: query.district, primaryCrops: query.primaryCrop },
  })
  const sort = buildSort(query, 'createdAt')

  const [records, total] = await Promise.all([
    farmerRepository.findMany({ filter, sort, skip: pagination.skip, limit: pagination.limit }),
    farmerRepository.count(filter),
  ])

  return { data: records.map(toFarmerDto), meta: buildPaginationMeta(total, pagination) }
}

async function update(id: string, input: UpdateFarmerInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<FarmerDto> {
  const farmer = await farmerRepository.findById(id)
  if (!farmer) throw ApiError.notFound('Farmer not found')

  const canManage = actor.permissions.includes('farmers.update')
  if (!canManage && !isOwner(farmer, actor)) {
    throw ApiError.forbidden('You do not have permission to update this farmer')
  }

  // Self-service farmers can edit their own contact/farm details, but not
  // the internal operations notes kept about them.
  const payload = { ...input }
  if (!canManage) delete payload.notes

  const changedKeys = Object.keys(payload) as (keyof IFarmer)[]
  const before = farmer as unknown as Record<string, unknown>

  const updated = await farmerRepository.updateById(id, { ...payload, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Farmer not found')

  const after = updated as unknown as Record<string, unknown>
  await auditService.record({
    actor,
    action: 'Farmer Updated',
    entityType: 'Farmer',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, before[key]]))),
    newValue: JSON.stringify(Object.fromEntries(changedKeys.map((key) => [key, after[key]]))),
    ip: meta.ip,
  })

  return toFarmerDto(updated)
}

async function updateStatus(id: string, input: UpdateFarmerStatusInput, actor: AuthenticatedUser, meta: RequestMeta): Promise<FarmerDto> {
  assertCanManage(actor, 'farmers.update')

  const farmer = await farmerRepository.findById(id)
  if (!farmer) throw ApiError.notFound('Farmer not found')

  const previousStatus = farmer.status
  const updated = await farmerRepository.updateById(id, { status: input.status, updatedBy: toObjectId(actor.id) })
  if (!updated) throw ApiError.notFound('Farmer not found')

  await auditService.record({
    actor,
    action: input.status === 'Inactive' ? 'Farmer Deactivated' : 'Farmer Reactivated',
    entityType: 'Farmer',
    entityId: id,
    affectedRecord: describe(updated),
    previousValue: previousStatus,
    newValue: input.status,
    ip: meta.ip,
  })

  return toFarmerDto(updated)
}

async function softDelete(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<void> {
  assertCanManage(actor, 'farmers.delete')

  const farmer = await farmerRepository.findById(id)
  if (!farmer) throw ApiError.notFound('Farmer not found')

  const deleted = await farmerRepository.softDeleteById(id)
  if (!deleted) throw ApiError.notFound('Farmer not found')

  await auditService.record({
    actor,
    action: 'Farmer Deleted',
    entityType: 'Farmer',
    entityId: id,
    affectedRecord: describe(farmer),
    previousValue: 'Active record',
    newValue: 'Soft-deleted',
    ip: meta.ip,
  })
}

async function restore(id: string, actor: AuthenticatedUser, meta: RequestMeta): Promise<FarmerDto> {
  assertCanManage(actor, 'farmers.delete')

  const farmer = await farmerRepository.findDeletedById(id)
  if (!farmer) throw ApiError.notFound('No deleted farmer found with this id')

  const restored = await farmerRepository.restoreById(id)
  if (!restored) throw ApiError.notFound('Farmer not found')

  await auditService.record({
    actor,
    action: 'Farmer Restored',
    entityType: 'Farmer',
    entityId: id,
    affectedRecord: describe(restored),
    previousValue: 'Soft-deleted',
    newValue: 'Active record',
    ip: meta.ip,
  })

  return toFarmerDto(restored)
}

export const farmerService = {
  register,
  getById,
  getMyProfile,
  list,
  update,
  updateStatus,
  softDelete,
  restore,
}
