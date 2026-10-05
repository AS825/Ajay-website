import { lazy } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LazyMotion, MotionConfig, domMax } from 'motion/react'
import { SiteDataProvider } from '../lib/data'
import { SmoothScrollProvider } from '../lib/smoothScroll'
import { Layout } from '../components/layout/Layout'
import { HomePage } from '../routes/HomePage'

// Sub-pages are split into their own chunks; the home page ships in the main bundle (LCP).
const EventsPage = lazy(() =>
  import('../routes/EventsPage').then((m) => ({ default: m.EventsPage })),
)
const EventDetailPage = lazy(() =>
  import('../routes/EventDetailPage').then((m) => ({ default: m.EventDetailPage })),
)
const BookingPage = lazy(() =>
  import('../routes/BookingPage').then((m) => ({ default: m.BookingPage })),
)
const PressPage = lazy(() => import('../routes/PressPage').then((m) => ({ default: m.PressPage })))
const LegalPage = lazy(() => import('../routes/LegalPage').then((m) => ({ default: m.LegalPage })))
const AdminPage = lazy(() => import('../routes/AdminPage').then((m) => ({ default: m.AdminPage })))
const NotFoundPage = lazy(() =>
  import('../routes/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
)

// Routes per SPEC §4. /tickets/:ticketId is deferred with the ticket feature (SPEC §18).
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'events/:slug', element: <EventDetailPage /> },
      { path: 'booking', element: <BookingPage /> },
      { path: 'press', element: <PressPage /> },
      { path: 'impressum', element: <LegalPage page="impressum" /> },
      { path: 'datenschutz', element: <LegalPage page="datenschutz" /> },
      { path: 'agb', element: <LegalPage page="agb" /> },
      { path: 'admin/*', element: <AdminPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function App() {
  return (
    // reducedMotion="user": motion disables transform animations for prefers-reduced-motion.
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domMax} strict>
        <SiteDataProvider>
          <SmoothScrollProvider>
            <RouterProvider router={router} />
          </SmoothScrollProvider>
        </SiteDataProvider>
      </LazyMotion>
    </MotionConfig>
  )
}
