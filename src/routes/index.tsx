import { lazy, Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/routes/Layout'
import HomePage from '@/pages/HomePage'

const AboutPage = lazy(() => import('@/pages/AboutPage'))
const ServicesPage = lazy(() => import('@/pages/ServicesPage'))
const PartnersPage = lazy(() => import('@/pages/PartnersPage'))
const InvestorsPage = lazy(() => import('@/pages/InvestorsPage'))
const ContactPage = lazy(() => import('@/pages/ContactPage'))
const BlogPage = lazy(() => import('@/pages/BlogPage'))
const FaqPage = lazy(() => import('@/pages/FaqPage'))
const CareersPage = lazy(() => import('@/pages/CareersPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

function lazyPage(element: ReactNode) {
  return <Suspense fallback={<div className="min-h-screen bg-neutral-50" />}>{element}</Suspense>
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
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
])
