import { useTranslation } from 'react-i18next'
import { useSiteData } from '../lib/data'
import { isUpcoming } from '../lib/events'
import { Container, Section } from '../components/ui/Section'
import { EventCard } from '../features/events/EventCard'
import { PageShell } from './PageShell'

/** Basic list in Phase 1; collapsible past events and polish in Phase 3. */
export function EventsPage() {
  const { t } = useTranslation()
  const { events, ready } = useSiteData()
  const upcoming = events.filter((e) => isUpcoming(e))
  const past = events.filter((e) => !isUpcoming(e)).reverse()

  return (
    <PageShell>
      <Section eyebrow={t('events.eyebrow')} title={t('events.title')}>
        <Container>
          {ready && upcoming.length === 0 && <p className="text-muted">{t('events.empty')}</p>}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <li key={e.id}>
                <EventCard event={e} />
              </li>
            ))}
          </ul>
          {past.length > 0 && (
            <details className="mt-16 border-t border-hairline pt-6">
              <summary className="pressable flex min-h-12 cursor-pointer items-center text-2xl font-bold tracking-tight">
                {t('events.past')} ({past.length})
              </summary>
              <ul className="mt-6 grid gap-4 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((e) => (
                  <li key={e.id}>
                    <EventCard event={e} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </Container>
      </Section>
    </PageShell>
  )
}
