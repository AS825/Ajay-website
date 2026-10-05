import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { orderBy } from 'firebase/firestore'
import { Plus, Users } from 'lucide-react'
import { useCollectionData } from '../hooks'
import { fmtDateTime } from '../format'
import type { AdminEvent } from '../types'
import { useLang } from '../../i18n'
import { useNow } from '../../lib/hooks'
import { Empty, PageHeader, Spinner } from '../ui/Kit'
import { useCreateEvent } from '../useCreateEvent'
import { buttonClass } from '../../components/ui/Button'
import { SegmentedControl } from '../../components/ui/SegmentedControl'

/** All events, upcoming first; "new" creates a draft and opens the editor. */
export default function EventsList() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const now = useNow(60_000)
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')
  const { create, creating } = useCreateEvent()
  const events = useCollectionData<AdminEvent>('events', [orderBy('startsAt')], 'byStart')

  const list = (events ?? []).filter((e) =>
    tab === 'upcoming' ? e.endsAt.toDate() >= now : e.endsAt.toDate() < now,
  )
  if (tab === 'past') list.reverse()

  return (
    <>
      <PageHeader
        title={t('admin.nav.events')}
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
      <SegmentedControl
        className="mb-4"
        label={t('admin.nav.events')}
        value={tab}
        onChange={setTab}
        options={[
          { value: 'upcoming', label: t('admin.events.upcoming') },
          { value: 'past', label: t('admin.events.past') },
        ]}
      />
      {!events ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <Empty>{t('admin.events.none')}</Empty>
      ) : (
        <ul className="space-y-2">
          {list.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-3 rounded-[20px] border border-hairline bg-white/[0.03] p-2 pr-3"
            >
              <Link to={`/admin/events/${e.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                <span className="aspect-[4/5] w-14 shrink-0 overflow-hidden rounded-[12px] bg-white/[0.06]">
                  {e.flyerUrl && <img src={e.flyerUrl} alt="" className="size-full object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{e.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {fmtDateTime(e.startsAt, lang)}
                  </span>
                  <span className="mt-1 flex gap-1.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${e.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/70'}`}
                    >
                      {e.status === 'published'
                        ? t('admin.events.published')
                        : t('admin.events.draft')}
                    </span>
                    {e.guestlist.enabled && (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tabular-nums">
                        {e.guestlist.count}/{e.guestlist.capacity}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
              {e.guestlist.enabled && (
                <Link
                  to={`/admin/events/${e.id}/guestlist`}
                  className={buttonClass('glass', '', 'icon')}
                  aria-label={`${t('admin.events.guestlist')}: ${e.title}`}
                >
                  <Users className="size-5" aria-hidden="true" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
