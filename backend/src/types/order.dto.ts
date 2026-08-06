import type { OrderStatus } from '../models/order.model'

export interface OrderItemDto {
  id: string
  inventoryId: string
  produceType: string
  quantity: number
  unitPrice: number
  subtotalAmount: number
  farmerId: string
  costPerUnit: number
}

export interface OrderDto {
  id: string
  orderNumber: string
  invoiceNumber: string | null
  customerId: string
  customerName: string
  items: OrderItemDto[]

  subtotalAmount: number
  totalAmount: number
  farmerEarningsTotal: number
  profitAmount: number

  status: OrderStatus
  deliveryAddress: string | null
  deliveryDate: Date | null

  confirmedAt: Date | null
  deliveredAt: Date | null
  cancelledAt: Date | null
  cancellationReason: string | null
  notes: string | null

  createdAt: Date
  updatedAt: Date
}

export interface SalesStatsSummaryDto {
  orderCount: number
  byStatus: Record<OrderStatus, number>
  totalRevenue: number
  totalFarmerEarnings: number
  totalProfit: number
}
