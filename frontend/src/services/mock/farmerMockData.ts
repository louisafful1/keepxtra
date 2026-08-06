import type { FarmerProfile, NotificationItem } from '@/types/farmer'
import { notificationCategoryByType } from '@/types/farmer'

export const mockFarmerProfile: FarmerProfile = {
  id: 'farmer-001',
  name: 'Kwame Asante',
  email: 'farmer@keepxtra.com',
  phone: '+233 24 555 0187',
  farmLocation: 'Nsawam, Eastern Region, Ghana',
  preferredPayoutMethod: 'MTN Mobile Money',
  payoutAccountNumber: '024 555 0187',
}

export const mockFarmerNotifications: NotificationItem[] = [
  {
    id: 'ntf-01',
    type: 'pickup',
    category: notificationCategoryByType.pickup,
    title: 'Pickup confirmed',
    message: 'Your pickup request for 700kg of Plantain has been assigned to driver Samuel Owusu.',
    createdAt: '2026-07-29T09:15:00Z',
    read: false,
  },
  {
    id: 'ntf-02',
    type: 'inspection',
    category: notificationCategoryByType.inspection,
    title: 'Produce inspected',
    message: 'Your Tomatoes delivery passed quality inspection and graded A.',
    createdAt: '2026-07-28T14:40:00Z',
    read: false,
  },
  {
    id: 'ntf-03',
    type: 'sale',
    category: notificationCategoryByType.sale,
    title: 'Produce sold',
    message: '400kg of Carrots was sold to Savanna Bistro for GHS 2,400.',
    createdAt: '2026-07-20T11:05:00Z',
    read: false,
  },
  {
    id: 'ntf-04',
    type: 'payment',
    category: notificationCategoryByType.payment,
    title: 'Payment processed',
    message: 'A payout of GHS 5,200 was sent to your MTN Mobile Money account.',
    createdAt: '2026-07-26T16:00:00Z',
    read: true,
  },
  {
    id: 'ntf-05',
    type: 'storage-reminder',
    category: notificationCategoryByType['storage-reminder'],
    title: 'Storage reminder',
    message: 'Your Carrots batch has 12 days of estimated shelf life remaining.',
    createdAt: '2026-07-18T08:30:00Z',
    read: true,
  },
  {
    id: 'ntf-06',
    type: 'system',
    category: notificationCategoryByType.system,
    title: 'Welcome to KeepXtra',
    message: 'Your farmer account is fully set up. Submit a storage request whenever you have produce ready.',
    createdAt: '2026-07-01T08:00:00Z',
    read: true,
  },
]
