import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore'
import { Mail, Phone, Trash2 } from 'lucide-react'
import { adminDb } from '../firebase'
import { useCollectionData, type WithId } from '../hooks'
import { fmtDateTime } from '../format'
import { BOOKING_STATUSES, type BookingEntry, type BookingStatus } from '../types'
import { useLang } from '../../i18n'
import { Empty, PageHeader, Select, Spinner, TextField } from '../ui/Kit'
import { toast } from '../ui/Toast'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { buttonClass } from '../../components/ui/Button'

const STATUS_STYLE: Record<BookingStatus, string> = {
  new: 'bg-accent text-white',
  inProgress: 'bg-amber-400/20 text-amber-200',
  confirmed: 'bg-emerald-500/20 text-emerald-300',
  declined: 'bg-white/10 text-white/60',
}

function Detail({ b, onClose }: { b: WithId<BookingEntry>; onClose: () => void }) {
  const { t } = useTranslation()
  const { lang } = useLang()
  const [notes, setNotes] = useState(b.notes ?? '')
  const ref = doc(adminDb, 'bookings', b.id)

  const update = async (data: Partial<BookingEntry>, msg = t('admin.common.saved')) => {
    try {
      await updateDoc(ref, data)
      toast(msg)
    } catch {
      toast(t('admin.common.error'), 'error')
    }
  }

  const rows: [string, string | number | undefined][] = [
    [t('booking.fields.company'), b.company],
    [t('booking.fields.eventType'), t(`booking.eventTypes.${b.eventType}`)],
    [t('booking.fields.date'), b.date],
    [t('booking.fields.location'), b.location],
    [t('booking.fields.setLength'), b.setLength],
    [t('booking.fields.expectedGuests'), b.expectedGuests],
    [t('booking.fields.budget'), t(`booking.budgets.${b.budget}`)],
  ]
  const subject = encodeURIComponent(`Re: Booking ${b.date} – ${b.location}`)

  return (
    <div className="space-y-5 pb-2">
      <p className="text-xs text-muted">{fmtDateTime(b.createdAt, lang)}</p>
      <div className="flex flex-wrap gap-2">
        <a
          href={`mailto:${b.email}?subject=${subject}`}
          className={buttonClass('primary', '', 'sm')}
        >
          <Mail className="size-4" aria-hidden="true" /> {t('admin.inbox.reply')}
        </a>
        {b.phone && (
          <a href={`tel:${b.phone.replace(/\s/g, '')}`} className={buttonClass('glass', '', 'sm')}>
            <Phone className="size-4" aria-hidden="true" /> {b.phone}
          </a>
        )}
      </div>
      <dl className="divide-y divide-hairline rounded-[18px] border border-hairline">
        <div className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-2.5 text-sm">
          <dt className="text-muted">{t('booking.fields.email')}</dt>
          <dd className="break-all">{b.email}</dd>
        </div>
        {rows
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => (
            <div key={k} className="grid grid-cols-[8rem_1fr] gap-3 px-4 py-2.5 text-sm">
              <dt className="text-muted">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
      {b.message && (
        <div>
          <p className="mb-1 text-sm text-muted">{t('booking.fields.message')}</p>
          <p className="rounded-[18px] bg-white/[0.04] p-4 text-sm whitespace-pre-line">
            {b.message}
          </p>
        </div>
      )}
      <Select<BookingStatus>
        label={t('admin.inbox.statusLabel')}
        value={b.status}
        onChange={(status) => update({ status })}
        options={BOOKING_STATUSES.map((s) => ({ value: s, label: t(`admin.inbox.status.${s}`) }))}
      />
      <div>
        <TextField
          label={t('admin.inbox.notes')}
          value={notes}
          onChange={setNotes}
          multiline
          rows={4}
        />
        <button
          type="button"
          disabled={notes === (b.notes ?? '')}
          onClick={() => update({ notes })}
          className={buttonClass('glass', 'mt-2', 'sm')}
        >
          {t('admin.common.save')}
        </button>
      </div>
      <button
        type="button"
        onClick={async () => {
          if (!window.confirm(t('admin.inbox.confirmDelete', { name: b.name }))) return
          await deleteDoc(ref).then(
            () => (toast(t('admin.common.deleted')), onClose()),
            () => toast(t('admin.common.error'), 'error'),
          )
        }}
        className="flex min-h-11 items-center gap-2 text-sm text-white/50 hover:text-accent"
      >
        <Trash2 className="size-4" aria-hidden="true" /> {t('admin.common.delete')}
      </button>
    </div>
  )
}

/** Booking inbox (SPEC §10.8): status, notes, reply via mailto. */
export default function Inbox() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<BookingStatus | 'all'>('all')
  const bookings = useCollectionData<BookingEntry>(
    'bookings',
    [orderBy('createdAt', 'desc')],
    'byCreated',
  )
  const openId = params.get('open')
  const open = bookings?.find((b) => b.id === openId)

  const list = (bookings ?? []).filter((b) => filter === 'all' || b.status === filter)

  return (
    <>
      <PageHeader title={t('admin.nav.inbox')} />
      <div className="mb-4">
        <Select<BookingStatus | 'all'>
          label={t('admin.inbox.statusLabel')}
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all', label: t('admin.common.all') },
            ...BOOKING_STATUSES.map((s) => ({ value: s, label: t(`admin.inbox.status.${s}`) })),
          ]}
        />
      </div>
      {!bookings ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <Empty>{t('admin.inbox.empty')}</Empty>
      ) : (
        <ul className="space-y-2">
          {list.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setParams({ open: b.id })}
                className="pressable flex w-full items-start gap-3 rounded-[20px] border border-hairline bg-white/[0.03] p-4 text-left hover:border-white/25"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span
                      className={`truncate font-semibold ${b.status === 'new' ? '' : 'text-white/80'}`}
                    >
                      {b.name}
                    </span>
                    {b.company && (
                      <span className="truncate text-xs text-muted">· {b.company}</span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-white/70">
                    {t(`booking.eventTypes.${b.eventType}`)} · {b.date} · {b.location}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted">
                    {fmtDateTime(b.createdAt, lang)}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_STYLE[b.status]}`}
                >
                  {t(`admin.inbox.status.${b.status}`)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <BottomSheet open={!!open} onClose={() => setParams({})} title={open?.name ?? ''}>
        {open && <Detail key={open.id} b={open} onClose={() => setParams({})} />}
      </BottomSheet>
    </>
  )
}
