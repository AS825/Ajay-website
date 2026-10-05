import type { ReactNode } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { signOut, type User } from 'firebase/auth'
import { where } from 'firebase/firestore'
import {
  CalendarDays,
  ExternalLink,
  FileText,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  Palette,
} from 'lucide-react'
import { auth } from './firebase'
import { useCollectionData } from './hooks'
import { LanguageSwitch } from '../components/layout/LanguageSwitch'

const NAV = [
  { to: '/admin', key: 'dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/events', key: 'events', icon: CalendarDays },
  { to: '/admin/inbox', key: 'inbox', icon: Inbox },
  { to: '/admin/design', key: 'design', icon: Palette },
  { to: '/admin/links', key: 'links', icon: Link2 },
  { to: '/admin/content', key: 'content', icon: FileText },
] as const

/** Mobile: bottom tab bar (thumb reach). Desktop: sidebar. */
export function AdminLayout({ user, children }: { user: User; children: ReactNode }) {
  const { t } = useTranslation()
  const newBookings =
    useCollectionData('bookings', [where('status', '==', 'new')], 'new')?.length ?? 0

  const badge = (key: string) =>
    key === 'inbox' && newBookings > 0 ? (
      <span className="absolute -top-1 right-0 min-w-5 rounded-full bg-accent px-1.5 text-center text-[10px] leading-5 font-bold md:static md:ml-auto">
        {newBookings}
      </span>
    ) : null

  return (
    <div className="min-h-[100svh] md:pl-60">
      {/* Top bar */}
      <header
        className="glass sticky top-0 z-30 border-x-0 border-t-0"
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="flex h-14 items-center justify-between gap-3 px-4 md:px-8">
          <Link to="/admin" className="text-base font-extrabold tracking-tight md:hidden">
            AJAY<span className="text-accent">.</span>{' '}
            <span className="font-medium text-white/50">Admin</span>
          </Link>
          <span className="hidden truncate text-sm text-muted md:block">{user.email}</span>
          <div className="flex items-center gap-1">
            <a
              href="/"
              target="_blank"
              rel="noopener"
              className="pressable grid size-11 place-items-center rounded-full text-white/70 hover:text-white"
              aria-label={t('admin.nav.viewSite')}
            >
              <ExternalLink className="size-5" />
            </a>
            <button
              type="button"
              onClick={() => signOut(auth)}
              className="pressable grid size-11 place-items-center rounded-full text-white/70 hover:text-white"
              aria-label={t('admin.auth.signOut')}
            >
              <LogOut className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Desktop sidebar */}
      <nav
        aria-label="Admin"
        className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-hairline bg-surface p-4 md:flex"
      >
        <Link to="/admin" className="mb-8 px-3 pt-2 text-xl font-extrabold tracking-tight">
          AJAY<span className="text-accent">.</span>{' '}
          <span className="font-medium text-white/50">Admin</span>
        </Link>
        <ul className="space-y-1">
          {NAV.map(({ to, key, icon: Icon, ...rest }) => (
            <li key={key}>
              <NavLink
                to={to}
                end={'end' in rest}
                className={({ isActive }) =>
                  `pressable flex min-h-11 items-center gap-3 rounded-full px-3 text-sm font-semibold ${isActive ? 'bg-white text-black' : 'text-white/70 hover:bg-white/5 hover:text-white'}`
                }
              >
                <Icon className="size-5" aria-hidden="true" /> {t(`admin.nav.${key}`)} {badge(key)}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="mt-auto px-1">
          <LanguageSwitch />
        </div>
      </nav>

      <main className="px-4 pt-6 pb-[calc(7rem+var(--safe-bottom))] md:px-8 md:pb-24">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>

      {/* Mobile tab bar */}
      <nav
        aria-label="Admin"
        className="glass fixed inset-x-0 bottom-0 z-30 border-x-0 border-b-0 md:hidden"
        style={{ paddingBottom: 'var(--safe-bottom)' }}
      >
        <ul className="grid grid-cols-6">
          {NAV.map(({ to, key, icon: Icon, ...rest }) => (
            <li key={key}>
              <NavLink
                to={to}
                end={'end' in rest}
                className={({ isActive }) =>
                  `pressable relative flex min-h-16 flex-col items-center justify-center gap-1 text-[10px] font-semibold ${isActive ? 'text-white' : 'text-white/45'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative">
                      <Icon
                        className={`size-6 ${isActive ? 'text-accent' : ''}`}
                        aria-hidden="true"
                      />
                      {badge(key)}
                    </span>
                    {t(`admin.nav.${key}`)}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
