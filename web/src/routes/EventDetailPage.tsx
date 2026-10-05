import { lazy, Suspense, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowUpRight, CalendarPlus, Check, MapPin, Share2 } from 'lucide-react'
import {
  appleMapsUrl,
  buildIcs,
  eventState,
  googleCalendarUrl,
  googleMapsUrl,
  localize,
} from '@ajay/shared'
import { useSiteData } from '../lib/data'
import { formatEventDate } from '../lib/format'
import { useNow } from '../lib/hooks'
import { downloadFile, shareOrCopy } from '../lib/share'
import { eventBadge, type EventView } from '../lib/events'
import { useLang } from '../i18n'
import { Container } from '../components/ui/Section'
import { MediaPlaceholder } from '../components/ui/MediaPlaceholder'
import { BottomSheet } from '../components/ui/BottomSheet'
import { Badge } from '../components/ui/Badge'
import { buttonClass } from '../components/ui/Button'
import { ClipReveal, Reveal, RevealText } from '../components/motion/Reveal'
import { Countdown } from '../features/events/Countdown'
import { PageShell } from './PageShell'
import { NotFoundPage } from './NotFoundPage'

// Form libraries load only when the guestlist sheet is opened.
const GuestlistForm = lazy(() =>
  import('../features/events/GuestlistForm').then((m) => ({ default: m.GuestlistForm })),
)

type Sheet = 'guestlist' | 'calendar' | null

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] gap-4 border-b border-hairline py-4">
      <dt className="eyebrow pt-0.5">{label}</dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

/** Event detail page (SPEC §6). Past events are shown as an archive without actions. */
export function EventDetailPage() {
  const { slug } = useParams()
  const { t } = useTranslation()
  const { events, ready } = useSiteData()
  const event = events.find((e) => e.slug === slug)

  if (!ready)
    return (
      <PageShell>
        <Container className="py-20 text-muted">{t('common.loading')}</Container>
      </PageShell>
    )
  if (!event) return <NotFoundPage />
  return <EventDetail event={event} />
}

function EventDetail({ event }: { event: EventView }) {
  const { t } = useTranslation()
  const { lang } = useLang()
  const now = useNow(30_000)
  const [sheet, setSheet] = useState<Sheet>(null)
  const [copied, setCopied] = useState(false)

  const state = eventState(event, now)
  const badge = eventBadge(event, now)
  const start = formatEventDate(event.startsAt, lang)
  const end = formatEventDate(event.endsAt, lang)
  const description = localize(event.description, lang)
  const dresscode = localize(event.dresscode, lang)
  const url = `${window.location.origin}/events/${event.slug}`
  const g = event.guestlist
  const spotsLeft = Math.max(0, g.capacity - g.count)
  const showSpots = state.guestlist === 'open' && spotsLeft <= Math.max(10, g.capacity * 0.25)

  const share = async () => {
    const result = await shareOrCopy({
      title: event.title,
      text: `${event.title} – ${start.date}`,
      url,
    })
    if (result === 'copied') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }
  const downloadIcs = () => {
    downloadFile(
      `${event.slug}.ics`,
      buildIcs({ ...event, description }, url),
      'text/calendar;charset=utf-8',
    )
    setSheet(null)
  }

  // Primary action: guestlist (or waitlist), else external tickets.
  const guestlistAction =
    state.guestlist === 'open' || state.guestlist === 'full' ? (
      <button
        type="button"
        onClick={() => setSheet('guestlist')}
        className={buttonClass('primary', 'flex-1')}
      >
        {state.guestlist === 'open'
          ? t('events.detail.joinGuestlist')
          : t('events.detail.joinWaitlist')}
      </button>
    ) : null
  const ticketAction = state.externalTickets ? (
    <a
      href={event.ticketing.externalUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass(guestlistAction ? 'glass' : 'primary', 'flex-1')}
    >
      {t('events.detail.externalTickets')} <ArrowUpRight className="size-4" aria-hidden="true" />
    </a>
  ) : null
  const hasActions = !state.isPast

  const shareButton = (extra: string, iconOnly = false) => (
    <button
      type="button"
      onClick={share}
      className={buttonClass('glass', extra, iconOnly ? 'icon' : 'md')}
      aria-label={copied ? t('events.detail.copied') : t('events.detail.share')}
    >
      {copied ? (
        <Check className={iconOnly ? 'size-5' : 'size-4'} aria-hidden="true" />
      ) : (
        <Share2 className={iconOnly ? 'size-5' : 'size-4'} aria-hidden="true" />
      )}
      <span className={iconOnly ? 'sr-only' : ''}>
        {copied ? t('events.detail.copied') : t('events.detail.share')}
      </span>
    </button>
  )

  return (
    <PageShell>
      <article className="relative isolate overflow-hidden pb-28 md:pb-20">
        {/* Blurred flyer as ambient backdrop. */}
        {event.flyerUrl && (
          <div className="absolute inset-x-0 top-0 -z-10 h-[70svh] opacity-40" aria-hidden="true">
            <img
              src={event.flyerUrl}
              alt=""
              className="size-full scale-110 object-cover blur-3xl"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
          </div>
        )}

        <Container className="pt-4">
          <Link
            to="/events"
            className="pressable mb-4 inline-flex min-h-12 items-center gap-2 text-sm font-medium text-white/70 hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" /> {t('events.detail.back')}
          </Link>

          <div className="grid gap-8 md:grid-cols-[5fr_6fr] md:gap-14">
            <ClipReveal className="overflow-hidden rounded-[var(--radius-card)] border border-hairline md:sticky md:top-24 md:self-start">
              {event.flyerUrl ? (
                <img
                  src={event.flyerUrl}
                  alt={event.title}
                  fetchPriority="high"
                  className={`aspect-[4/5] w-full object-cover ${state.isPast ? 'grayscale-[60%]' : ''}`}
                />
              ) : (
                <MediaPlaceholder label="TODO flyer" className="aspect-[4/5]" />
              )}
            </ClipReveal>

            <div>
              <Reveal>
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {badge && (
                    <Badge
                      tone={
                        badge === 'guestlistOpen' || badge === 'live'
                          ? 'accent'
                          : badge === 'past'
                            ? 'muted'
                            : 'neutral'
                      }
                    >
                      {t(`events.badge.${badge}`)}
                    </Badge>
                  )}
                  {event.minAge !== null && (
                    <Badge tone="muted">{t('events.minAge', { age: event.minAge })}</Badge>
                  )}
                  {showSpots && (
                    <Badge tone="muted">{t('events.detail.spotsLeft', { count: spotsLeft })}</Badge>
                  )}
                </div>
                <p className="eyebrow mb-3 text-white/80">
                  {start.date} · {start.time}
                </p>
              </Reveal>
              <RevealText
                as="h1"
                text={event.title}
                className="display-lg mb-4 block"
                onMount
                delay={0.1}
              />
              <Reveal delay={0.15}>
                <p className="mb-8 flex items-center gap-2 text-lg text-white/80">
                  <MapPin className="size-5 shrink-0 text-accent" aria-hidden="true" />
                  {event.venue.name}
                </p>
              </Reveal>

              {state.isPast ? (
                <p className="mb-8 rounded-[18px] border border-hairline bg-white/[0.04] p-4 text-white/70">
                  {t('events.detail.archived')}
                </p>
              ) : (
                <Reveal delay={0.2} className="mb-8 space-y-6">
                  <Countdown startsAt={event.startsAt} endsAt={event.endsAt} />
                  {/* Desktop actions; on mobile they live in the sticky bar below. */}
                  <div className="hidden flex-wrap gap-3 md:flex">
                    {guestlistAction}
                    {ticketAction}
                    {state.guestlist === 'closed' && (
                      <p className="flex min-h-12 items-center text-sm text-muted">
                        {t('events.detail.guestlistClosed')}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSheet('calendar')}
                      className={buttonClass('outline')}
                    >
                      <CalendarPlus className="size-4" aria-hidden="true" />{' '}
                      {t('events.detail.addToCalendar')}
                    </button>
                    {shareButton('hidden md:inline-flex')}
                  </div>
                </Reveal>
              )}

              <Reveal delay={0.1}>
                <dl className="mb-10 border-t border-hairline">
                  <InfoRow label={t('events.detail.date')}>{start.date}</InfoRow>
                  <InfoRow label={t('events.detail.time')}>
                    {t('events.detail.doors', { start: start.time, end: end.time })}
                  </InfoRow>
                  <InfoRow label={t('events.detail.venue')}>
                    <p className="font-semibold">{event.venue.name}</p>
                    {event.venue.address && <p className="text-muted">{event.venue.address}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a
                        href={googleMapsUrl(event.venue)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClass('outline', '', 'sm')}
                      >
                        {t('events.detail.googleMaps')}{' '}
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </a>
                      <a
                        href={appleMapsUrl(event.venue)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonClass('outline', '', 'sm')}
                      >
                        {t('events.detail.appleMaps')}{' '}
                        <ArrowUpRight className="size-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </InfoRow>
                  <InfoRow label={t('events.detail.lineup')}>
                    {event.lineup.length ? (
                      <ul className="space-y-1">
                        {event.lineup.map((name) => (
                          <li key={name} className="text-lg font-bold tracking-tight">
                            {name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      t('events.detail.noLineup')
                    )}
                  </InfoRow>
                  {event.minAge !== null && (
                    <InfoRow label={t('events.detail.age')}>
                      {t('events.minAge', { age: event.minAge })}
                    </InfoRow>
                  )}
                  {dresscode && <InfoRow label={t('events.detail.dresscode')}>{dresscode}</InfoRow>}
                </dl>
              </Reveal>

              {description && (
                <Reveal>
                  <h2 className="eyebrow mb-3">{t('events.detail.about')}</h2>
                  <p className="text-lg leading-relaxed whitespace-pre-line text-white/85">
                    {description}
                  </p>
                </Reveal>
              )}
            </div>
          </div>
        </Container>
      </article>

      {/* Mobile sticky action bar (glass), thumb-reachable. */}
      {hasActions && (
        <div
          className="glass fixed inset-x-0 bottom-0 z-30 flex gap-2 border-x-0 border-b-0 px-4 pt-3 md:hidden"
          style={{ paddingBottom: 'calc(0.75rem + var(--safe-bottom))' }}
        >
          {guestlistAction ??
            ticketAction ??
            (state.guestlist === 'closed' ? (
              <p className="flex min-h-12 flex-1 items-center text-sm text-muted">
                {t('events.detail.guestlistClosed')}
              </p>
            ) : (
              <span className="flex-1" />
            ))}
          {guestlistAction && ticketAction && (
            <a
              href={event.ticketing.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass('glass', '', 'icon')}
              aria-label={t('events.detail.externalTickets')}
            >
              <ArrowUpRight className="size-5" aria-hidden="true" />
            </a>
          )}
          {shareButton('', true)}
        </div>
      )}

      <BottomSheet
        open={sheet === 'guestlist'}
        onClose={() => setSheet(null)}
        title={
          state.guestlist === 'full'
            ? t('events.detail.joinWaitlist')
            : t('events.detail.joinGuestlist')
        }
      >
        {state.guestlist === 'full' && (
          <p className="mb-4 text-sm text-white/80">{t('events.detail.waitlistInfo')}</p>
        )}
        <Suspense fallback={<div className="h-96" aria-busy="true" />}>
          <GuestlistForm
            event={event}
            waitlist={state.guestlist === 'full'}
            onDone={() => setSheet(null)}
          />
        </Suspense>
      </BottomSheet>

      <BottomSheet
        open={sheet === 'calendar'}
        onClose={() => setSheet(null)}
        title={t('events.detail.addToCalendar')}
      >
        <div className="grid gap-3">
          <button type="button" onClick={downloadIcs} className={buttonClass('primary', 'w-full')}>
            {t('events.detail.calendarApple')}
          </button>
          <a
            href={googleCalendarUrl({ ...event, description }, url)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setSheet(null)}
            className={buttonClass('glass', 'w-full')}
          >
            {t('events.detail.calendarGoogle')}{' '}
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </div>
      </BottomSheet>
    </PageShell>
  )
}
