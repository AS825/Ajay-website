import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { useSiteData } from '../../lib/data'
import { SmartLink } from '../ui/SmartLink'
import { SocialIcon } from '../ui/SocialIcon'
import { LanguageSwitch } from './LanguageSwitch'

const ITEMS = [
  { key: 'events', href: '/events' },
  { key: 'music', href: '/#music' },
  { key: 'sets', href: '/#sets' },
  { key: 'drops', href: '/#drops' },
  { key: 'about', href: '/#about' },
  { key: 'press', href: '/press' },
  { key: 'booking', href: '/booking' },
] as const

/** Full-screen overlay menu (Carl-Cox style). Animated in Phase 2. */
export function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { linksBy } = useSiteData()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black/95 backdrop-blur-2xl"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <div className="px-safe flex h-16 items-center justify-end">
        <button
          type="button"
          onClick={onClose}
          className="pressable glass grid size-12 place-items-center rounded-full"
          aria-label={t('nav.closeMenu')}
          autoFocus
        >
          <X className="size-5" />
        </button>
      </div>
      <nav className="px-safe flex-1 pt-4">
        <ul className="space-y-1">
          {ITEMS.map((item) => (
            <li key={item.key}>
              <SmartLink
                href={item.href}
                onClick={onClose}
                className="pressable block py-1 text-[clamp(2.5rem,11vw,5rem)] leading-[1.02] font-extrabold tracking-[-0.045em] uppercase hover:text-accent"
              >
                {t(`nav.${item.key}`)}
              </SmartLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-safe flex flex-wrap items-center justify-between gap-4 py-8">
        <ul className="flex flex-wrap gap-1">
          {linksBy('social').map((l) => (
            <li key={l.id}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={l.subtitle ? `${l.title} – ${l.subtitle.en}` : l.title}
                className="pressable grid size-12 place-items-center rounded-full text-white/80 hover:text-white"
              >
                <SocialIcon icon={l.icon} />
              </a>
            </li>
          ))}
        </ul>
        <LanguageSwitch />
      </div>
    </div>
  )
}
