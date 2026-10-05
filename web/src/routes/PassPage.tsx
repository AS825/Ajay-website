import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, Clock, MapPin } from 'lucide-react'
import { passUrl, type GuestPassView } from '@ajay/shared'
import { callFunction } from '../lib/callable'
import { formatEventDate } from '../lib/format'
import { useLang } from '../i18n'
import { Container } from '../components/ui/Section'
import { QrCode } from '../components/ui/QrCode'
import { Badge } from '../components/ui/Badge'
import { buttonClass } from '../components/ui/Button'
import { PageShell } from './PageShell'

/** Guest pass with QR code (link from the confirmation mail). */
export function PassPage() {
  const { eventId = '', entryId = '' } = useParams()
  const [params] = useSearchParams()
  const token = params.get('t') ?? ''
  const { t } = useTranslation()
  const { lang } = useLang()
  const [pass, setPass] = useState<GuestPassView | null | undefined>(undefined)

  useEffect(() => {
    let alive = true
    callFunction<{ eventId: string; entryId: string; token: string }, GuestPassView>(
      'getGuestPass',
      { eventId, entryId, token },
    )
      .then((p) => alive && setPass(p))
      .catch(() => alive && setPass(null))
    return () => {
      alive = false
    }
  }, [eventId, entryId, token])

  // Keep passes out of search engines.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  if (pass === undefined) {
    return (
      <PageShell>
        <Container className="grid min-h-[60svh] place-items-center text-muted">
          {t('common.loading')}
        </Container>
      </PageShell>
    )
  }
  if (pass === null) {
    return (
      <PageShell>
        <Container className="flex min-h-[60svh] flex-col justify-center gap-4 py-16">
          <h1 className="display-lg">{t('pass.notFoundTitle')}</h1>
          <p className="text-muted">{t('pass.notFoundText')}</p>
          <Link to="/events" className={buttonClass('glass', 'self-start')}>
            {t('events.all')}
          </Link>
        </Container>
      </PageShell>
    )
  }

  const date = formatEventDate(new Date(pass.event.startsAt), lang)
  const past = new Date(pass.event.endsAt) < new Date()
  const confirmed = pass.status === 'confirmed'

  return (
    <PageShell>
      <Container className="max-w-md py-8">
        <div className="overflow-hidden rounded-[var(--radius-sheet)] border border-hairline bg-surface shadow-soft">
          <div className="relative p-6 pb-4">
            {pass.event.flyerUrl && (
              <img
                src={pass.event.flyerUrl}
                alt=""
                className="absolute inset-0 -z-0 size-full object-cover opacity-25 blur-2xl"
                aria-hidden="true"
              />
            )}
            <div className="relative">
              <p className="eyebrow mb-2">{t('pass.title')}</p>
              <h1 className="text-3xl leading-tight font-extrabold tracking-tight">
                {pass.event.title}
              </h1>
              <p className="mt-2 text-sm text-white/80">
                {date.date} · {date.time}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                <MapPin className="size-4 shrink-0" aria-hidden="true" /> {pass.event.venue.name}
              </p>
            </div>
          </div>

          <div className="border-t border-dashed border-white/20 p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xl font-bold tracking-tight">
                  {pass.firstName} {pass.lastName}
                </p>
                <p className="text-sm text-muted">
                  {t('pass.guests', { count: 1 + pass.plusOnes })}
                </p>
              </div>
              {pass.checkedIn ? (
                <Badge tone="neutral">
                  <CheckCircle2 className="size-3.5" aria-hidden="true" /> {t('pass.checkedIn')}
                </Badge>
              ) : confirmed ? (
                <Badge tone="accent">{t('pass.valid')}</Badge>
              ) : (
                <Badge tone="muted">
                  <Clock className="size-3.5" aria-hidden="true" /> {t('pass.waitlist')}
                </Badge>
              )}
            </div>

            {confirmed && !past ? (
              <>
                <QrCode
                  text={passUrl(window.location.origin, { eventId, entryId, token })}
                  label={t('pass.qrLabel')}
                  className="mx-auto w-full max-w-72"
                />
                <p className="mt-4 text-center text-sm text-white/70">{t('pass.showAtDoor')}</p>
                <p className="mt-1 text-center text-xs text-muted">{t('pass.brightness')}</p>
              </>
            ) : (
              <p className="rounded-[16px] bg-white/[0.05] p-4 text-sm text-white/80">
                {past ? t('pass.past') : t('pass.waitlistText')}
              </p>
            )}
          </div>
        </div>
        <Link to={`/events/${pass.event.slug}`} className={buttonClass('glass', 'mt-4 w-full')}>
          {t('pass.eventDetails')}
        </Link>
      </Container>
    </PageShell>
  )
}
