import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { WebsiteLayout } from '@/layouts/WebsiteLayout'
import { PortalLayout } from '@/layouts/PortalLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import HomePage from '@/pages/website/HomePage'

// ---------- Website ----------
const AboutPage = lazy(() => import('@/pages/website/AboutPage'))
const ServicesPage = lazy(() => import('@/pages/website/ServicesPage'))
const PartnersPage = lazy(() => import('@/pages/website/PartnersPage'))
const InvestorsPage = lazy(() => import('@/pages/website/InvestorsPage'))
const ContactPage = lazy(() => import('@/pages/website/ContactPage'))
const BlogPage = lazy(() => import('@/pages/website/BlogPage'))
const FaqPage = lazy(() => import('@/pages/website/FaqPage'))
const CareersPage = lazy(() => import('@/pages/website/CareersPage'))
const NotFoundPage = lazy(() => import('@/pages/website/NotFoundPage'))

// ---------- Auth ----------
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))

// ---------- Farmer portal ----------
const PortalDashboardPage = lazy(() => import('@/pages/portal/DashboardPage'))
const MyProducePage = lazy(() => import('@/pages/portal/MyProducePage'))
const StorageRequestsPage = lazy(() => import('@/pages/portal/StorageRequestsPage'))
const PortalPickupRequestsPage = lazy(() => import('@/pages/portal/PickupRequestsPage'))
const SalesHistoryPage = lazy(() => import('@/pages/portal/SalesHistoryPage'))
const PortalPaymentsPage = lazy(() => import('@/pages/portal/PaymentsPage'))
const NotificationsPage = lazy(() => import('@/pages/portal/NotificationsPage'))
const SupportPage = lazy(() => import('@/pages/portal/SupportPage'))
const ProfilePage = lazy(() => import('@/pages/portal/ProfilePage'))

// ---------- Admin dashboard ----------
const AdminDashboardPage = lazy(() => import('@/pages/admin/DashboardPage'))
const FarmersPage = lazy(() => import('@/pages/admin/FarmersPage'))
const AdminStorageRequestsPage = lazy(() => import('@/pages/admin/StorageRequestsPage'))
const InventoryPage = lazy(() => import('@/pages/admin/InventoryPage'))
const WarehousesPage = lazy(() => import('@/pages/admin/WarehousesPage'))
const AdminPickupRequestsPage = lazy(() => import('@/pages/admin/PickupRequestsPage'))
const InspectionsPage = lazy(() => import('@/pages/admin/InspectionsPage'))
const FleetPage = lazy(() => import('@/pages/admin/FleetPage'))
const OrdersPage = lazy(() => import('@/pages/admin/OrdersPage'))
const SalesPage = lazy(() => import('@/pages/admin/SalesPage'))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/PaymentsPage'))
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'))
const AnalyticsPage = lazy(() => import('@/pages/admin/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/pages/admin/SettingsPage'))
const DriversPage = lazy(() => import('@/pages/admin/DriversPage'))
const AuditLogPage = lazy(() => import('@/pages/admin/AuditLogPage'))

function lazyPage(element: ReactNode) {
  return <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <WebsiteLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: lazyPage(<AboutPage />) },
      { path: 'services', element: lazyPage(<ServicesPage />) },
      { path: 'partners', element: lazyPage(<PartnersPage />) },
      { path: 'investors', element: lazyPage(<InvestorsPage />) },
      { path: 'contact', element: lazyPage(<ContactPage />) },
      { path: 'blog', element: lazyPage(<BlogPage />) },
      { path: 'faq', element: lazyPage(<FaqPage />) },
      { path: 'careers', element: lazyPage(<CareersPage />) },
      { path: '*', element: lazyPage(<NotFoundPage />) },
    ],
  },
  {
    path: '/login',
    element: lazyPage(<LoginPage />),
  },
  {
    element: <ProtectedRoute allowedRole="farmer" />,
    children: [
      {
        path: '/portal',
        element: <PortalLayout />,
        children: [
          { index: true, element: lazyPage(<PortalDashboardPage />) },
          { path: 'produce', element: lazyPage(<MyProducePage />) },
          { path: 'storage-requests', element: lazyPage(<StorageRequestsPage />) },
          { path: 'pickup-requests', element: lazyPage(<PortalPickupRequestsPage />) },
          { path: 'sales', element: lazyPage(<SalesHistoryPage />) },
          { path: 'payments', element: lazyPage(<PortalPaymentsPage />) },
          { path: 'notifications', element: lazyPage(<NotificationsPage />) },
          { path: 'support', element: lazyPage(<SupportPage />) },
          { path: 'profile', element: lazyPage(<ProfilePage />) },
          { path: '*', element: <Navigate to="/portal" replace /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute allowedRole="admin" />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: lazyPage(<AdminDashboardPage />) },
          { path: 'farmers', element: lazyPage(<FarmersPage />) },
          { path: 'storage-requests', element: lazyPage(<AdminStorageRequestsPage />) },
          { path: 'inventory', element: lazyPage(<InventoryPage />) },
          { path: 'warehouses', element: lazyPage(<WarehousesPage />) },
          { path: 'pickup-requests', element: lazyPage(<AdminPickupRequestsPage />) },
          { path: 'inspections', element: lazyPage(<InspectionsPage />) },
          { path: 'fleet', element: lazyPage(<FleetPage />) },
          { path: 'drivers', element: lazyPage(<DriversPage />) },
          { path: 'orders', element: lazyPage(<OrdersPage />) },
          { path: 'sales', element: lazyPage(<SalesPage />) },
          { path: 'payments', element: lazyPage(<AdminPaymentsPage />) },
          { path: 'reports', element: lazyPage(<ReportsPage />) },
          { path: 'analytics', element: lazyPage(<AnalyticsPage />) },
          { path: 'audit-log', element: lazyPage(<AuditLogPage />) },
          { path: 'settings', element: lazyPage(<SettingsPage />) },
          { path: '*', element: <Navigate to="/admin" replace /> },
        ],
      },
    ],
  },
])
