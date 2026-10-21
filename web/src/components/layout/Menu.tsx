import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { X } from 'lucide-react'
import { useSiteData } from '../../lib/data'
import { easeOutExpo } from '../../lib/motion'
import { useScrollLock } from '../../lib/smoothScroll'
import { SmartLink } from '../ui/SmartLink'
import { SocialIcon } from '../ui/SocialIcon'
import { LanguageSwitch } from './LanguageSwitch'

const ITEMS = [
  { key: 'about', href: '/#about' },
  { key: 'venues', href: '/#venues' },
  { key: 'rider', href: '/#rider' },
  { key: 'livesets', href: '/#livesets' },
  { key: 'links', href: '/#links' },
  { key: 'events', href: '/events' },
  { key: 'press', href: 'PRESS_KIT' },
  { key: 'booking', href: '/booking' },
] as const

/** Full-screen overlay menu: fades in, links rise in one after another. */
export function Menu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const { linksBy, site } = useSiteData()
  const reduced = useReducedMotion()
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const wipe = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }

  return (
    <AnimatePresence>
      {open && (
        <m.div
          id="site-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-black/95 backdrop-blur-2xl"
          style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
          data-lenis-prevent
          {...wipe}
          transition={{ duration: 0.4, ease: easeOutExpo }}
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
            <m.ul
              className="space-y-1"
              initial="hidden"
              animate="shown"
              exit="hidden"
              variants={{ shown: { transition: { staggerChildren: 0.05, delayChildren: 0.12 } } }}
            >
              {ITEMS.map((item) => (
                <li key={item.key} className="overflow-hidden">
                  <m.div
                    variants={reduced ? {} : { hidden: { y: '105%' }, shown: { y: '0%' } }}
                    transition={{ duration: 0.8, ease: easeOutExpo }}
                    style={{ transformOrigin: 'left bottom' }}
                  >
                    <SmartLink
                      href={item.href === 'PRESS_KIT' ? site.pressKitUrl || '/press' : item.href}
                      onClick={onClose}
                      className="pressable block py-1 text-[clamp(2.25rem,9vw,4rem)] leading-[1.05] tracking-[-0.03em] uppercase transition-opacity hover:opacity-50"
                    >
                      {t(`nav.${item.key}`)}
                    </SmartLink>
                  </m.div>
                </li>
              ))}
            </m.ul>
          </nav>
          <m.div
            className="px-safe flex flex-wrap items-center justify-between gap-4 py-8"
            initial={{ opacity: 0, y: 16 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: { delay: 0.45, duration: 0.6, ease: easeOutExpo },
            }}
            exit={{ opacity: 0, transition: { duration: 0.15 } }}
          >
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
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
