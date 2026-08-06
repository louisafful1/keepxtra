export type ActivityType =
  | 'storage-request-created'
  | 'storage-request-approved'
  | 'storage-request-rejected'
  | 'storage-request-info-requested'
  | 'pickup-approved'
  | 'driver-assigned'
  | 'produce-collected'
  | 'produce-received'
  | 'inspection-completed'
  | 'sale-completed'
  | 'payment-requested'
  | 'payment-approved'
  | 'payment-rejected'
  | 'payment-sent'

export interface ActivityEvent {
  id: string
  type: ActivityType
  title: string
  description: string
  createdAt: string
  actor: 'farmer' | 'admin' | 'system'
}
