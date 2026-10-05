import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, m, useMotionValueEvent, useScroll } from 'motion/react'
import { ChevronRight } from 'lucide-react'
import { useSiteData } from '../../lib/data'
import { countdownTo, useNow } from '../../lib/hooks'
import { springBouncy } from '../../lib/motion'
import { MediaPlaceholder } from '../../components/ui/MediaPlaceholder'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Sticky glass pill with the next event and a live countdown (SPEC §3).
 * On the home page it appears once the hero is scrolled past.
 */
export function NextEventPill() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { events } = useSiteData()
  const { scrollY } = useScroll()
  const [pastHero, setPastHero] = useState(false)
  useMotionValueEvent(scrollY, 'change', (y) => setPastHero(y > window.innerHeight * 0.6))

  const now = useNow()
  const next = events.find((e) => e.endsAt > now)
  const countdown = next ? countdownTo(next.startsAt, now) : null

  const hiddenHere =
    pathname.startsWith('/admin') ||
    (next && pathname === `/events/${next.slug}`) ||
    (pathname === '/' && !pastHero)
  const visible = !!next && !!countdown && !hiddenHere

  let label = ''
  if (countdown) {
    if (countdown.done) label = t('pill.live')
    else if (countdown.days > 0)
      label = `${countdown.days}${t('pill.d')} ${pad(countdown.hours)}${t('pill.h')} ${pad(countdown.minutes)}${t('pill.m')}`
    else label = `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`
  }

  return (
    <AnimatePresence>
      {visible && next && (
        <m.div
          className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-4"
          style={{ bottom: 'calc(0.75rem + var(--safe-bottom))' }}
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={springBouncy}
        >
          <Link
            to={`/events/${next.slug}`}
            className="pressable glass pointer-events-auto flex min-h-14 w-full max-w-md items-center gap-3 rounded-full bg-[rgb(18_18_20/0.72)] py-1.5 pr-3 pl-1.5 shadow-soft"
          >
            <span className="size-11 shrink-0 overflow-hidden rounded-full">
              {next.flyerUrl ? (
                <img src={next.flyerUrl} alt="" className="size-full object-cover" />
              ) : (
                <MediaPlaceholder className="size-full" />
              )}
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[11px] font-semibold tracking-[0.14em] text-white/60 uppercase">
                {countdown?.done ? t('pill.live') : t('pill.next')}
              </span>
              <span className="block truncate text-sm font-semibold">{next.title}</span>
            </span>
            <span
              className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-xs font-bold tabular-nums"
              aria-label={`${t('pill.startsIn')} ${label}`}
            >
              {label}
            </span>
            <ChevronRight className="size-4 shrink-0 text-white/50" aria-hidden="true" />
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  )
}
