import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSiteData } from '../../lib/data'
import { isUpcoming } from '../../lib/events'
import { Section } from '../../components/ui/Section'
import { EventCard } from '../events/EventCard'

/** Horizontal snap carousel of upcoming events (SPEC §4.3). */
export function UpcomingEvents() {
  const { t } = useTranslation()
  const { events, ready } = useSiteData()
  const upcoming = events.filter((e) => isUpcoming(e))

  return (
    <Section
      id="events"
      eyebrow={t('events.eyebrow')}
      title={t('events.title')}
      action={
        <Link
          to="/events"
          className="pressable flex min-h-12 shrink-0 items-center gap-1 text-sm font-semibold text-white/80 hover:text-white"
        >
          {t('events.all')} <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      }
    >
      {!ready ? (
        <div
          className="px-safe mx-auto flex max-w-6xl gap-4 overflow-hidden"
          aria-busy="true"
          aria-label={t('common.loading')}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className="aspect-[4/5] w-[78%] shrink-0 animate-pulse rounded-[var(--radius-card)] bg-surface-2 sm:w-[340px]"
            />
          ))}
        </div>
      ) : upcoming.length === 0 ? (
        <p className="px-safe mx-auto max-w-6xl text-muted">{t('events.empty')}</p>
      ) : (
        <ul
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2"
          style={{
            paddingInline: 'max(1rem, var(--safe-left), calc((100vw - 72rem) / 2 + 1rem))',
            scrollPaddingInline: 'max(1rem, var(--safe-left), calc((100vw - 72rem) / 2 + 1rem))',
          }}
        >
          {upcoming.map((e) => (
            <li key={e.id} className="w-[78%] shrink-0 snap-start sm:w-[340px]">
              <EventCard event={e} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}
