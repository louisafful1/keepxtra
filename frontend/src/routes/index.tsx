import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { MainErrorBoundary } from '@/components/MainErrorBoundary'
import { WebsiteLayout } from '@/layouts/WebsiteLayout'
import HomePage from '@/pages/website/HomePage'

// ---------- Website ----------
const AboutPage = lazy(() => import('@/pages/website/AboutPage'))
const ServicesPage = lazy(() => import('@/pages/website/ServicesPage'))
const PartnersPage = lazy(() => import('@/pages/website/PartnersPage'))
const InvestorsPage = lazy(() => import('@/pages/website/InvestorsPage'))
const ContactPage = lazy(() => import('@/pages/website/ContactPage'))
const FaqPage = lazy(() => import('@/pages/website/FaqPage'))
const NotFoundPage = lazy(() => import('@/pages/website/NotFoundPage'))

function lazyPage(element: ReactNode) {
  return <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <WebsiteLayout />,
    errorElement: <MainErrorBoundary />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'about', element: lazyPage(<AboutPage />) },
      { path: 'services', element: lazyPage(<ServicesPage />) },
      { path: 'partners', element: lazyPage(<PartnersPage />) },
      { path: 'investors', element: lazyPage(<InvestorsPage />) },
      { path: 'contact', element: lazyPage(<ContactPage />) },
      { path: 'faq', element: lazyPage(<FaqPage />) },
      { path: '*', element: lazyPage(<NotFoundPage />) },
    ],
  },
])
