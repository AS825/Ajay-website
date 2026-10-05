import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { localize } from '@ajay/shared'
import { useSiteData } from '../lib/data'
import { formatEventDate } from '../lib/format'
import { useLang } from '../i18n'
import { Container } from '../components/ui/Section'
import { MediaPlaceholder } from '../components/ui/MediaPlaceholder'
import { BottomSheet } from '../components/ui/BottomSheet'
import { buttonClass } from '../components/ui/Button'
import { eventBadge } from '../lib/events'
import { PageShell } from './PageShell'
import { NotFoundPage } from './NotFoundPage'

/** Minimal detail view; the full page (actions, .ics, share, countdown) is Phase 3. */
export function EventDetailPage() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const { lang } = useLang()
  const { events, ready } = useSiteData()
  const event = events.find((e) => e.slug === slug)
  const [sheet, setSheet] = useState(false)

  if (!ready)
    return (
      <PageShell>
        <Container className="py-20 text-muted">{t('common.loading')}</Container>
      </PageShell>
    )
  if (!event) return <NotFoundPage />

  return (
    <PageShell>
      <Container className="py-10">
        <Link
          to="/events"
          className="pressable mb-6 inline-flex min-h-12 items-center gap-2 text-sm text-white/70"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {t('common.back')}
        </Link>
        <div className="grid gap-8 md:grid-cols-2">
          {event.flyerUrl ? (
            <img
              src={event.flyerUrl}
              alt={event.title}
              className="w-full rounded-[var(--radius-card)]"
            />
          ) : (
            <MediaPlaceholder
              label="TODO flyer"
              className="aspect-[4/5] rounded-[var(--radius-card)]"
            />
          )}
          <div>
            <p className="eyebrow mb-3">{formatEventDate(event.startsAt, lang).full}</p>
            <h1 className="display-lg mb-4">{event.title}</h1>
            <p className="mb-6 text-muted">
              {event.venue.name} · {event.venue.address}
            </p>
            <p className="text-lg text-white/85">{localize(event.description, lang)}</p>
            {eventBadge(event) === 'guestlistOpen' && (
              <button
                type="button"
                onClick={() => setSheet(true)}
                className={buttonClass('primary', 'mt-8 w-full sm:w-auto')}
              >
                {t('events.joinGuestlist')}
              </button>
            )}
            <p className="mt-10 rounded-[16px] border border-hairline p-4 text-sm text-muted">
              {t('events.comingSoon')}
            </p>
          </div>
        </div>
      </Container>
      <BottomSheet open={sheet} onClose={() => setSheet(false)} title={t('events.joinGuestlist')}>
        <p className="mb-2 font-semibold">{event.title}</p>
        <p className="text-sm text-muted">{t('events.guestlistSoon')}</p>
      </BottomSheet>
    </PageShell>
  )
}
