import type { PayoutMethod, PayoutStatus } from '../models/payout.model'

export interface PayoutDto {
  id: string
  payoutCode: string
  farmerId: string
  farmerName: string
  farmerNumber: string
  orderId: string
  orderNumber: string
  amount: number

  status: PayoutStatus
  method: PayoutMethod | null
  transactionId: string | null

  approvedBy: string | null
  approvedAt: Date | null
  processedBy: string | null
  processedAt: Date | null
  rejectedBy: string | null
  rejectedAt: Date | null
  rejectionReason: string | null
  notes: string | null

  createdAt: Date
  updatedAt: Date
}

export interface FarmerPayoutSummaryDto {
  farmerId: string
  farmerName: string
  outstandingBalance: number
  totalPaid: number
  payoutCount: number
}

export interface PayoutStatsSummaryDto {
  payoutCount: number
  byStatus: Record<PayoutStatus, number>
  totalOutstanding: number
  totalPaid: number
}
