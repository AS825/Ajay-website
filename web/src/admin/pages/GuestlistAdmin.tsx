import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  doc,
  increment,
  orderBy,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import {
  ArrowLeft,
  ArrowUpCircle,
  Check,
  Download,
  Mail,
  Printer,
  ScanLine,
  Search,
  Trash2,
} from 'lucide-react'
import { slugify, toCsv } from '@ajay/shared'
import { adminDb } from '../firebase'
import { useCollectionData, useDocData, type WithId } from '../hooks'
import { fmtDateTime } from '../format'
import type { AdminEvent, GuestEntry } from '../types'
import { useLang } from '../../i18n'
import { downloadFile } from '../../lib/share'
import { callFunction } from '../../lib/callable'
import { controlClass, Empty, PageHeader, Spinner } from '../ui/Kit'
import { toast } from '../ui/Toast'
import { buttonClass } from '../../components/ui/Button'
import { SegmentedControl } from '../../components/ui/SegmentedControl'

type Filter = 'all' | 'confirmed' | 'waitlist' | 'checkedIn'

/** Guestlist per event (SPEC §10.5): search, CSV, check-in by tap, delete. */
export default function GuestlistAdmin() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { lang } = useLang()
  const event = useDocData<AdminEvent>(`events/${id}`)
  const entries = useCollectionData<GuestEntry>(
    `events/${id}/guestlist`,
    [orderBy('createdAt', 'desc')],
    'byCreated',
  )
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [sending, setSending] = useState(false)

  const stats = useMemo(() => {
    const list = entries ?? []
    const people = (e: GuestEntry) => 1 + e.plusOnes
    return {
      confirmed: list.filter((e) => e.status === 'confirmed').reduce((s, e) => s + people(e), 0),
      waitlist: list.filter((e) => e.status === 'waitlist').reduce((s, e) => s + people(e), 0),
      checkedIn: list.filter((e) => e.checkedIn).reduce((s, e) => s + people(e), 0),
    }
  }, [entries])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (entries ?? []).filter((e) => {
      if (filter === 'confirmed' && e.status !== 'confirmed') return false
      if (filter === 'waitlist' && e.status !== 'waitlist') return false
      if (filter === 'checkedIn' && !e.checkedIn) return false
      return !q || `${e.firstName} ${e.lastName} ${e.email}`.toLowerCase().includes(q)
    })
  }, [entries, search, filter])

  if (event === undefined || entries === undefined) {
    return (
      <div className="grid h-64 place-items-center">
        <Spinner />
      </div>
    )
  }
  if (!event) return <p className="text-muted">{t('admin.events.notFound')}</p>

  const entryRef = (entryId: string) => doc(adminDb, 'events', id, 'guestlist', entryId)

  const toggleCheckIn = async (e: WithId<GuestEntry>) => {
    try {
      await updateDoc(entryRef(e.id), {
        checkedIn: !e.checkedIn,
        checkedInAt: e.checkedIn ? null : serverTimestamp(),
      })
    } catch {
      toast(t('admin.common.error'), 'error')
    }
  }

  // Count changes run in a transaction with the event so guestlist.count stays exact.
  // Server-side: updates the count and mails the confirmation with the QR pass.
  const promote = async (e: WithId<GuestEntry>, force = false): Promise<void> => {
    try {
      await callFunction('promoteGuest', { eventId: id, entryId: e.id, force })
      toast(t('admin.guestlist.promoted', { name: e.firstName }))
    } catch (err) {
      const reason = (err as { details?: { reason?: string } }).details?.reason
      if (reason === 'overCapacity' && !force) {
        if (window.confirm(t('admin.guestlist.confirmOverCapacity'))) return promote(e, true)
        return
      }
      toast(t('admin.common.error'), 'error')
    }
  }

  const sendList = async () => {
    setSending(true)
    try {
      const res = await callFunction<{ eventId: string }, { entries: number }>(
        'sendGuestlistDigest',
        { eventId: id },
      )
      toast(t('admin.guestlist.listSent', { count: res.entries }))
    } catch {
      toast(t('admin.common.error'), 'error')
    } finally {
      setSending(false)
    }
  }

  const remove = async (e: WithId<GuestEntry>) => {
    if (
      !window.confirm(t('admin.guestlist.confirmDelete', { name: `${e.firstName} ${e.lastName}` }))
    )
      return
    try {
      await runTransaction(adminDb, async (tx) => {
        const snap = await tx.get(entryRef(e.id))
        if (!snap.exists()) return
        const data = snap.data() as GuestEntry
        tx.delete(entryRef(e.id))
        if (data.status === 'confirmed') {
          tx.update(doc(adminDb, 'events', id), {
            'guestlist.count': increment(-(1 + data.plusOnes)),
          })
        }
      })
      toast(t('admin.common.deleted'))
    } catch {
      toast(t('admin.common.error'), 'error')
    }
  }

  const exportCsv = () => {
    const rows = [
      [
        'First name',
        'Last name',
        'Email',
        'Phone',
        'Plus-ones',
        'Status',
        'Checked in',
        'Newsletter',
        'Signed up',
      ],
      ...(entries ?? []).map((e) => [
        e.firstName,
        e.lastName,
        e.email,
        e.phone,
        e.plusOnes,
        e.status,
        e.checkedIn ? 'yes' : '',
        e.newsletter ? 'yes' : '',
        e.createdAt ? e.createdAt.toDate().toISOString() : '',
      ]),
    ]
    downloadFile(`guestlist-${slugify(event.title)}.csv`, toCsv(rows), 'text/csv;charset=utf-8')
  }

  return (
    <>
      <Link
        to={`/admin/events/${id}`}
        className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> {event.title}
      </Link>
      <PageHeader
        title={t('admin.events.guestlist')}
        subtitle={fmtDateTime(event.startsAt, lang)}
        actions={
          <>
            <Link to={`/admin/events/${id}/scan`} className={buttonClass('primary', '', 'sm')}>
              <ScanLine className="size-4" aria-hidden="true" /> {t('admin.scan.open')}
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!entries.length}
              className={buttonClass('glass', '', 'sm')}
            >
              <Printer className="size-4" aria-hidden="true" /> {t('admin.guestlist.print')}
            </button>
            <button
              type="button"
              onClick={sendList}
              disabled={sending}
              className={buttonClass('glass', '', 'sm')}
            >
              <Mail className="size-4" aria-hidden="true" /> {t('admin.guestlist.sendList')}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!entries.length}
              className={buttonClass('glass', '', 'sm')}
            >
              <Download className="size-4" aria-hidden="true" /> CSV
            </button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          [t('admin.guestlist.confirmed'), `${stats.confirmed}/${event.guestlist.capacity}`],
          [t('admin.guestlist.checkedIn'), stats.checkedIn],
          [t('admin.guestlist.waitlist'), stats.waitlist],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-[18px] border border-hairline bg-white/[0.03] p-3"
          >
            <p className="text-2xl font-extrabold tabular-nums">{value}</p>
            <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">{label}</p>
          </div>
        ))}
      </div>

      <div className="relative mb-3">
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-white/40"
          aria-hidden="true"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('admin.guestlist.search')}
          aria-label={t('admin.guestlist.search')}
          className={`${controlClass} pl-11`}
        />
      </div>
      <div className="no-scrollbar mb-4 overflow-x-auto">
        <SegmentedControl
          label={t('admin.guestlist.filter')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('admin.common.all') },
            { value: 'confirmed', label: t('admin.guestlist.confirmed') },
            { value: 'waitlist', label: t('admin.guestlist.waitlist') },
            { value: 'checkedIn', label: t('admin.guestlist.checkedIn') },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <Empty>{entries.length ? t('admin.guestlist.noMatch') : t('admin.guestlist.empty')}</Empty>
      ) : (
        <ul className="space-y-2">
          {visible.map((e) => (
            <li
              key={e.id}
              className={`flex items-center gap-3 rounded-[20px] border p-2 pl-4 transition-colors ${e.checkedIn ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-hairline bg-white/[0.03]'}`}
            >
              <div className="min-w-0 flex-1 py-1">
                <p className="truncate font-semibold">
                  {e.firstName} {e.lastName}
                  {e.plusOnes > 0 && <span className="ml-1.5 text-white/60">+{e.plusOnes}</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {e.email}
                  {e.status === 'waitlist' && (
                    <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-200 uppercase">
                      {t('admin.guestlist.waitlist')}
                    </span>
                  )}
                </p>
              </div>
              {e.status === 'waitlist' && (
                <button
                  type="button"
                  onClick={() => promote(e)}
                  className={buttonClass('glass', '', 'icon')}
                  aria-label={t('admin.guestlist.promote', { name: e.firstName })}
                >
                  <ArrowUpCircle className="size-5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(e)}
                className={buttonClass('glass', 'text-white/60', 'icon')}
                aria-label={`${t('admin.common.delete')}: ${e.firstName} ${e.lastName}`}
              >
                <Trash2 className="size-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => toggleCheckIn(e)}
                aria-pressed={e.checkedIn}
                className={`pressable flex min-h-12 min-w-24 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-bold ${e.checkedIn ? 'bg-emerald-500 text-black' : 'bg-white text-black'}`}
              >
                {e.checkedIn ? <Check className="size-4" aria-hidden="true" /> : null}
                {e.checkedIn ? t('admin.guestlist.in') : t('admin.guestlist.checkIn')}
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* Print view: only this is printed (see .print-area in index.css). */}
      <section className="print-area" aria-hidden="true">
        <h1>
          {t('admin.events.guestlist')} – {event.title}
        </h1>
        <p>
          {fmtDateTime(event.startsAt, lang)} · {event.venue.name} ·{' '}
          {t('admin.guestlist.confirmed')}: {stats.confirmed} · {t('admin.guestlist.waitlist')}:{' '}
          {stats.waitlist}
        </p>
        <table>
          <thead>
            <tr>
              <th>✓</th>
              <th>#</th>
              <th>{t('admin.guestlist.name')}</th>
              <th>+</th>
              <th>{t('admin.guestlist.statusCol')}</th>
              <th>{t('admin.guestlist.phone')}</th>
            </tr>
          </thead>
          <tbody>
            {[...entries]
              .sort((a, b) =>
                `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'de'),
              )
              .map((e, i) => (
                <tr key={e.id}>
                  <td>{e.checkedIn ? '☑' : '☐'}</td>
                  <td>{i + 1}</td>
                  <td>
                    <b>{e.lastName}</b>, {e.firstName}
                  </td>
                  <td>{e.plusOnes || ''}</td>
                  <td>
                    {e.status === 'confirmed'
                      ? t('admin.guestlist.confirmed')
                      : t('admin.guestlist.waitlist')}
                  </td>
                  <td>{e.phone}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>
    </>
  )
}
