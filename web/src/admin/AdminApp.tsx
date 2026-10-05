import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { useAdminAuth } from './hooks'
import { AdminLayout } from './AdminLayout'
import { LoginPage } from './LoginPage'
import { NoAccess } from './NoAccess'
import { Spinner } from './ui/Kit'
import { Toaster } from './ui/Toast'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const EventsList = lazy(() => import('./pages/EventsList'))
const EventEditor = lazy(() => import('./pages/EventEditor'))
const GuestlistAdmin = lazy(() => import('./pages/GuestlistAdmin'))
const Scanner = lazy(() => import('./pages/Scanner'))
const Inbox = lazy(() => import('./pages/Inbox'))
const Design = lazy(() => import('./pages/Design'))
const LinksAdmin = lazy(() => import('./pages/LinksAdmin'))
const Content = lazy(() => import('./pages/Content'))

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-[100svh] place-items-center p-6 text-center">{children}</div>
}

/** /admin/* – protected by Firebase Auth + custom claim `admin` (SPEC §10). */
export default function AdminApp() {
  const { user, isAdmin, loading } = useAdminAuth()

  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    const title = document.title
    document.title = 'Admin · AJAY ADAM'
    return () => {
      meta.remove()
      document.title = title
    }
  }, [])

  let content
  if (loading) {
    content = (
      <Centered>
        <Spinner />
      </Centered>
    )
  } else if (!user) {
    content = <LoginPage />
  } else if (!isAdmin) {
    content = <NoAccess user={user} />
  } else {
    content = (
      <AdminLayout user={user}>
        <Suspense
          fallback={
            <div className="grid h-64 place-items-center">
              <Spinner />
            </div>
          }
        >
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="events" element={<EventsList />} />
            <Route path="events/:id" element={<EventEditor />} />
            <Route path="events/:id/guestlist" element={<GuestlistAdmin />} />
            <Route path="events/:id/scan" element={<Scanner />} />
            <Route path="inbox" element={<Inbox />} />
            <Route path="design" element={<Design />} />
            <Route path="links" element={<LinksAdmin />} />
            <Route path="content" element={<Content />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </Suspense>
      </AdminLayout>
    )
  }

  return (
    <>
      <Toaster />
      {content}
    </>
  )
}
