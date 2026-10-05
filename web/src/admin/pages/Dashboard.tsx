import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { orderBy, limit } from 'firebase/firestore'
import { ArrowRight, Plus } from 'lucide-react'
import { useCollectionData } from '../hooks'
import { fmtDateTime } from '../format'
import type { AdminEvent, BookingEntry } from '../types'
import { useLang } from '../../i18n'
import { Card, Empty, PageHeader } from '../ui/Kit'
import { buttonClass } from '../../components/ui/Button'
import { useNow } from '../../lib/hooks'
import { useCreateEvent } from '../useCreateEvent'

function Stat({ label, value, to }: { label: string; value: number | string; to?: string }) {
  const body = (
    <>
      <span className="block text-4xl font-extrabold tracking-tight tabular-nums">{value}</span>
      <span className="mt-1 block text-xs font-semibold tracking-wide text-muted uppercase">
        {label}
      </span>
    </>
  )
  return to ? (
    <Link
      to={to}
      className="pressable block rounded-[var(--radius-card)] border border-hairline bg-white/[0.03] p-4 hover:border-white/25"
    >
      {body}
    </Link>
  ) : (
    <div className="rounded-[var(--radius-card)] border border-hairline bg-white/[0.03] p-4">
      {body}
    </div>
  )
}

/** Overview (SPEC §10.1): upcoming events with guestlist numbers, new booking requests. */
export default function Dashboard() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const now = useNow(60_000)
  const { create, creating } = useCreateEvent()
  const events = useCollectionData<AdminEvent>('events', [orderBy('startsAt')], 'byStart')
  const bookings = useCollectionData<BookingEntry>(
    'bookings',
    [orderBy('createdAt', 'desc'), limit(50)],
    'latest',
  )

  const upcoming = (events ?? []).filter((e) => e.endsAt.toDate() >= now)
  const newCount = (bookings ?? []).filter((b) => b.status === 'new').length
  const guests = upcoming
    .filter((e) => e.guestlist.enabled)
    .reduce((sum, e) => sum + e.guestlist.count, 0)

  return (
    <>
      <PageHeader
        title={t('admin.dashboard.title')}
        actions={
          <button
            type="button"
            onClick={create}
            disabled={creating}
            className={buttonClass('primary', '', 'sm')}
          >
            <Plus className="size-4" aria-hidden="true" /> {t('admin.events.new')}
          </button>
        }
      />
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat
          label={t('admin.dashboard.upcoming')}
          value={events ? upcoming.length : '…'}
          to="/admin/events"
        />
        <Stat label={t('admin.dashboard.guests')} value={events ? guests : '…'} />
        <Stat
          label={t('admin.dashboard.newBookings')}
          value={bookings ? newCount : '…'}
          to="/admin/inbox"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title={t('admin.dashboard.nextEvents')}
          actions={
            <Link to="/admin/events" className="text-sm text-white/60 hover:text-white">
              {t('admin.common.all')}
            </Link>
          }
        >
          {upcoming.length === 0 ? (
            <Empty>{t('admin.dashboard.noEvents')}</Empty>
          ) : (
            <ul className="space-y-3">
              {upcoming.slice(0, 4).map((e) => {
                const g = e.guestlist
                const pct = g.capacity ? Math.min(100, Math.round((g.count / g.capacity) * 100)) : 0
                return (
                  <li key={e.id} className="rounded-[18px] bg-white/[0.04] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{e.title}</p>
                        <p className="text-xs text-muted">
                          {fmtDateTime(e.startsAt, lang)}
                          {e.status === 'draft' && (
                            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase">
                              {t('admin.events.draft')}
                            </span>
                          )}
                        </p>
                      </div>
                      <Link
                        to={`/admin/events/${e.id}`}
                        className="shrink-0 text-sm text-white/60 hover:text-white"
                        aria-label={`${t('admin.common.edit')}: ${e.title}`}
                      >
                        <ArrowRight className="size-5" />
                      </Link>
                    </div>
                    {g.enabled && (
                      <Link to={`/admin/events/${e.id}/guestlist`} className="mt-3 block">
                        <div className="mb-1 flex justify-between text-xs text-white/70">
                          <span>{t('admin.events.guestlist')}</span>
                          <span className="tabular-nums">
                            {g.count} / {g.capacity}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <Card
          title={t('admin.dashboard.latestBookings')}
          actions={
            <Link to="/admin/inbox" className="text-sm text-white/60 hover:text-white">
              {t('admin.common.all')}
            </Link>
          }
        >
          {!bookings?.length ? (
            <Empty>{t('admin.inbox.empty')}</Empty>
          ) : (
            <ul className="divide-y divide-hairline">
              {bookings.slice(0, 5).map((b) => (
                <li key={b.id}>
                  <Link to={`/admin/inbox?open=${b.id}`} className="flex items-center gap-3 py-3">
                    {b.status === 'new' && (
                      <span
                        className="size-2 shrink-0 rounded-full bg-accent"
                        aria-label={t('admin.inbox.status.new')}
                      />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{b.name}</span>
                      <span className="block truncate text-xs text-muted">
                        {t(`booking.eventTypes.${b.eventType}`)} · {b.date} · {b.location}
                      </span>
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-white/40" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}
