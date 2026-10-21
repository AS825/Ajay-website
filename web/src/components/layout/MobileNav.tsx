import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { CalendarDays, FileText, Home, Link2, PlayCircle } from 'lucide-react'
import { useSiteData } from '../../lib/data'
import { SmartLink } from '../ui/SmartLink'

/** App-style tab bar on phones: the main destinations one tap away. */
export function MobileNav() {
  const { t } = useTranslation()
  const { pathname, hash } = useLocation()
  const { site } = useSiteData()
  const items = [
    {
      key: 'home',
      href: '/#top',
      Icon: Home,
      active: pathname === '/' && (!hash || hash === '#top'),
    },
    {
      key: 'events',
      href: '/#events',
      Icon: CalendarDays,
      active: pathname.startsWith('/events') || hash === '#events',
    },
    { key: 'livesets', href: '/#livesets', Icon: PlayCircle, active: hash === '#livesets' },
    { key: 'links', href: '/#links', Icon: Link2, active: hash === '#links' },
    { key: 'press', href: site.pressKitUrl || '/press', Icon: FileText, active: false },
  ]
  return (
    <nav
      aria-label={t('nav.mobile')}
      className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 md:hidden"
      style={{ paddingBottom: 'var(--safe-bottom)' }}
    >
      <ul className="grid h-16 grid-cols-5">
        {items.map(({ key, href, Icon, active }) => (
          <li key={key}>
            <SmartLink
              href={href}
              className={`flex size-full flex-col items-center justify-center gap-1 text-[0.65rem] uppercase transition-opacity ${active ? 'opacity-100' : 'opacity-55'}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="size-5" aria-hidden="true" strokeWidth={1.6} />
              {t(`nav.${key}`)}
            </SmartLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
