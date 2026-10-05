import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, m } from 'motion/react'
import { ChevronDown } from 'lucide-react'
import { useSiteData } from '../lib/data'
import { isUpcoming } from '../lib/events'
import { spring } from '../lib/motion'
import { Container, Section } from '../components/ui/Section'
import { Reveal } from '../components/motion/Reveal'
import { EventCard } from '../features/events/EventCard'
import { PageShell } from './PageShell'

/** All upcoming events + collapsed "Past Events" (SPEC §4 /events). */
export function EventsPage() {
  const { t } = useTranslation()
  const { events, ready } = useSiteData()
  const [showPast, setShowPast] = useState(false)
  const pastId = useId()
  const upcoming = events.filter((e) => isUpcoming(e))
  const past = events.filter((e) => !isUpcoming(e)).reverse()

  return (
    <PageShell>
      <Section headingLevel="h1" eyebrow={t('events.eyebrow')} title={t('events.title')}>
        <Container>
          {!ready ? (
            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-label={t('common.loading')}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] animate-pulse rounded-[var(--radius-card)] bg-surface-2"
                />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-muted">{t('events.empty')}</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e, i) => (
                <li key={e.id}>
                  <Reveal delay={(i % 3) * 0.08}>
                    <EventCard event={e} />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}

          {past.length > 0 && (
            <div className="mt-16 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={() => setShowPast((v) => !v)}
                aria-expanded={showPast}
                aria-controls={pastId}
                className="pressable flex min-h-14 w-full items-center justify-between text-left text-2xl font-bold tracking-tight"
              >
                <span>
                  {t('events.past')} <span className="text-white/40">({past.length})</span>
                </span>
                <m.span animate={{ rotate: showPast ? 180 : 0 }} transition={spring}>
                  <ChevronDown className="size-6" aria-hidden="true" />
                </m.span>
              </button>
              <AnimatePresence initial={false}>
                {showPast && (
                  <m.div
                    id={pastId}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={spring}
                    className="overflow-hidden"
                  >
                    <ul className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3">
                      {past.map((e) => (
                        <li key={e.id} className="opacity-70 transition-opacity hover:opacity-100">
                          <EventCard event={e} />
                        </li>
                      ))}
                    </ul>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </Container>
      </Section>
    </PageShell>
  )
}
