import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { SiteDataProvider } from '../lib/data'
import { Layout } from '../components/layout/Layout'
import { HomePage } from '../routes/HomePage'
import { EventsPage } from '../routes/EventsPage'
import { EventDetailPage } from '../routes/EventDetailPage'
import { BookingPage } from '../routes/BookingPage'
import { PressPage } from '../routes/PressPage'
import { LegalPage } from '../routes/LegalPage'
import { AdminPage } from '../routes/AdminPage'
import { NotFoundPage } from '../routes/NotFoundPage'

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
    <SiteDataProvider>
      <RouterProvider router={router} />
    </SiteDataProvider>
  )
}
