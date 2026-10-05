import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { ArrowLeft, ExternalLink, Trash2, Users } from 'lucide-react'
import { dateToViennaLocal, slugify, viennaLocalToDate, type Localized } from '@ajay/shared'
import { adminDb } from '../firebase'
import { useDocData } from '../hooks'
import type { AdminEvent } from '../types'
import { Card, LocalizedField, PageHeader, Spinner, TextField, Toggle } from '../ui/Kit'
import { MediaField } from '../ui/MediaField'
import { SaveBar } from '../ui/SaveBar'
import { toast } from '../ui/Toast'
import { buttonClass } from '../../components/ui/Button'

interface Form {
  title: string
  slug: string
  starts: string
  ends: string
  venueName: string
  address: string
  mapsUrl: string
  flyerUrl: string
  description: Localized
  dresscode: Localized
  lineup: string
  minAge: string
  published: boolean
  glEnabled: boolean
  capacity: string
  deadline: string
  maxPlusOnes: string
  externalUrl: string
}

function toForm(e: AdminEvent): Form {
  return {
    title: e.title,
    slug: e.slug,
    starts: dateToViennaLocal(e.startsAt.toDate()),
    ends: dateToViennaLocal(e.endsAt.toDate()),
    venueName: e.venue.name,
    address: e.venue.address,
    mapsUrl: e.venue.mapsUrl,
    flyerUrl: e.flyerUrl,
    description: e.description ?? { en: '' },
    dresscode: e.dresscode ?? { en: '' },
    lineup: e.lineup.join('\n'),
    minAge: e.minAge === null ? '' : String(e.minAge),
    published: e.status === 'published',
    glEnabled: e.guestlist.enabled,
    capacity: String(e.guestlist.capacity),
    deadline: e.guestlist.deadline ? dateToViennaLocal(e.guestlist.deadline.toDate()) : '',
    maxPlusOnes: String(e.guestlist.maxPlusOnes),
    externalUrl: e.ticketing.externalUrl,
  }
}

const isInt = (s: string, min = 0) => /^\d+$/.test(s) && Number(s) >= min
const isUrl = (s: string) => s === '' || /^https?:\/\/\S+$/.test(s)

function validate(f: Form): string | null {
  if (!f.title.trim()) return 'admin.events.errors.title'
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(f.slug)) return 'admin.events.errors.slug'
  if (!f.starts || !f.ends || viennaLocalToDate(f.ends) <= viennaLocalToDate(f.starts))
    return 'admin.events.errors.dates'
  if (f.minAge !== '' && !isInt(f.minAge)) return 'admin.events.errors.minAge'
  if (f.glEnabled && (!isInt(f.capacity, 1) || !isInt(f.maxPlusOnes)))
    return 'admin.events.errors.guestlist'
  if (Number(f.maxPlusOnes) > 10) return 'admin.events.errors.guestlist'
  if (!isUrl(f.externalUrl) || !isUrl(f.mapsUrl)) return 'admin.events.errors.url'
  if (f.published && !f.venueName.trim()) return 'admin.events.errors.venue'
  return null
}

/** Create/edit an event (SPEC §10.4). Own ticket types are deferred (SPEC §18). */
export default function EventEditor() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const event = useDocData<AdminEvent>(`events/${id}`)
  const [form, setForm] = useState<Form | null>(null)
  const [saving, setSaving] = useState(false)
  const initial = useMemo(() => (event ? toForm(event) : null), [event])

  // Follow server updates (other device, save) as long as there are no local edits.
  const lastInitial = useRef<Form | null>(null)
  useEffect(() => {
    if (!initial) return
    const unedited = !form || JSON.stringify(form) === JSON.stringify(lastInitial.current)
    lastInitial.current = initial
    if (unedited) setForm(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  if (event === undefined || (event && !form)) {
    return (
      <div className="grid h-64 place-items-center">
        <Spinner />
      </div>
    )
  }
  if (event === null || !form) {
    return <p className="text-muted">{t('admin.events.notFound')}</p>
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const dirty = JSON.stringify(form) !== JSON.stringify(initial)

  const save = async () => {
    const error = validate(form)
    if (error) return toast(t(error), 'error')
    setSaving(true)
    try {
      const clash = await getDocs(
        query(collection(adminDb, 'events'), where('slug', '==', form.slug)),
      )
      if (clash.docs.some((d) => d.id !== id)) {
        toast(t('admin.events.errors.slugTaken'), 'error')
        return
      }
      const dresscode =
        form.dresscode.en.trim() || form.dresscode.de?.trim() ? form.dresscode : null
      await updateDoc(doc(adminDb, 'events', id), {
        title: form.title.trim(),
        slug: form.slug,
        startsAt: Timestamp.fromDate(viennaLocalToDate(form.starts)),
        endsAt: Timestamp.fromDate(viennaLocalToDate(form.ends)),
        venue: {
          name: form.venueName.trim(),
          address: form.address.trim(),
          mapsUrl: form.mapsUrl.trim(),
        },
        flyerUrl: form.flyerUrl,
        description: form.description,
        dresscode,
        lineup: form.lineup
          .split(/\n|,/)
          .map((s) => s.trim())
          .filter(Boolean),
        minAge: form.minAge === '' ? null : Number(form.minAge),
        status: form.published ? 'published' : 'draft',
        // count is maintained by joinGuestlist and the guestlist admin, never overwritten here.
        'guestlist.enabled': form.glEnabled,
        'guestlist.capacity': Number(form.capacity) || 0,
        'guestlist.maxPlusOnes': Number(form.maxPlusOnes) || 0,
        'guestlist.deadline': form.deadline
          ? Timestamp.fromDate(viennaLocalToDate(form.deadline))
          : null,
        'ticketing.externalUrl': form.externalUrl.trim(),
      })
      toast(t('admin.common.saved'))
    } catch (err) {
      console.error(err)
      toast(t('admin.common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    if (!window.confirm(t('admin.events.confirmDelete', { title: event.title }))) return
    try {
      const entries = await getDocs(collection(adminDb, 'events', id, 'guestlist'))
      const batch = writeBatch(adminDb)
      entries.docs.forEach((d) => batch.delete(d.ref))
      await batch.commit()
      await deleteDoc(doc(adminDb, 'events', id))
      toast(t('admin.common.deleted'))
      navigate('/admin/events')
    } catch (err) {
      console.error(err)
      toast(t('admin.common.error'), 'error')
    }
  }

  return (
    <>
      <Link
        to="/admin/events"
        className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> {t('admin.nav.events')}
      </Link>
      <PageHeader
        title={form.title || t('admin.events.untitled')}
        actions={
          <>
            {event.status === 'published' && (
              <a
                href={`/events/${event.slug}`}
                target="_blank"
                rel="noopener"
                className={buttonClass('glass', '', 'sm')}
              >
                <ExternalLink className="size-4" aria-hidden="true" /> {t('admin.common.view')}
              </a>
            )}
            {event.guestlist.enabled && (
              <Link to={`/admin/events/${id}/guestlist`} className={buttonClass('glass', '', 'sm')}>
                <Users className="size-4" aria-hidden="true" /> {t('admin.events.guestlist')} (
                {event.guestlist.count})
              </Link>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Card>
            <Toggle
              checked={form.published}
              onChange={(v) => set('published', v)}
              label={form.published ? t('admin.events.published') : t('admin.events.draft')}
              description={t('admin.events.publishHint')}
            />
          </Card>

          <Card title={t('admin.events.basics')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                className="sm:col-span-2"
                label={t('admin.events.title')}
                value={form.title}
                onChange={(v) =>
                  setForm((f) =>
                    f
                      ? { ...f, title: v, slug: f.slug.startsWith('event-') ? slugify(v) : f.slug }
                      : f,
                  )
                }
              />
              <TextField
                className="sm:col-span-2"
                label={t('admin.events.slug')}
                hint={`/events/${form.slug}`}
                value={form.slug}
                onChange={(v) => set('slug', slugify(v))}
              />
              <TextField
                type="datetime-local"
                label={t('admin.events.starts')}
                hint={t('admin.events.viennaTime')}
                value={form.starts}
                onChange={(v) => set('starts', v)}
              />
              <TextField
                type="datetime-local"
                label={t('admin.events.ends')}
                value={form.ends}
                onChange={(v) => set('ends', v)}
              />
            </div>
          </Card>

          <Card title={t('admin.events.venue')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={t('admin.events.venueName')}
                value={form.venueName}
                onChange={(v) => set('venueName', v)}
              />
              <TextField
                label={t('admin.events.address')}
                value={form.address}
                onChange={(v) => set('address', v)}
              />
              <TextField
                className="sm:col-span-2"
                label={t('admin.events.mapsUrl')}
                hint={t('admin.common.optional')}
                value={form.mapsUrl}
                onChange={(v) => set('mapsUrl', v)}
              />
            </div>
          </Card>

          <Card title={t('admin.events.details')}>
            <div className="grid gap-4">
              <LocalizedField
                label={t('admin.events.description')}
                value={form.description}
                onChange={(v) => set('description', v)}
                multiline
                rows={6}
              />
              <TextField
                label={t('admin.events.lineup')}
                hint={t('admin.events.lineupHint')}
                value={form.lineup}
                onChange={(v) => set('lineup', v)}
                multiline
                rows={3}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label={t('admin.events.minAge')}
                  hint={t('admin.common.optional')}
                  inputMode="numeric"
                  value={form.minAge}
                  onChange={(v) => set('minAge', v.replace(/\D/g, ''))}
                />
              </div>
              <LocalizedField
                label={t('admin.events.dresscode')}
                value={form.dresscode}
                onChange={(v) => set('dresscode', v)}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title={t('admin.events.flyer')}>
            <MediaField
              label={t('admin.events.flyerUpload')}
              hint={t('admin.events.flyerHint')}
              value={form.flyerUrl}
              onChange={(v) => set('flyerUrl', v)}
              folder="flyers"
              image={{ aspect: 4 / 5, maxSize: 1600 }}
              aspect="aspect-[4/5]"
            />
          </Card>

          <Card title={t('admin.events.guestlist')}>
            <div className="space-y-4">
              <Toggle
                checked={form.glEnabled}
                onChange={(v) => set('glEnabled', v)}
                label={t('admin.events.guestlistEnabled')}
              />
              {form.glEnabled && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <TextField
                      label={t('admin.events.capacity')}
                      inputMode="numeric"
                      value={form.capacity}
                      onChange={(v) => set('capacity', v.replace(/\D/g, ''))}
                    />
                    <TextField
                      label={t('admin.events.maxPlusOnes')}
                      inputMode="numeric"
                      value={form.maxPlusOnes}
                      onChange={(v) => set('maxPlusOnes', v.replace(/\D/g, ''))}
                    />
                  </div>
                  <TextField
                    type="datetime-local"
                    label={t('admin.events.deadline')}
                    hint={t('admin.common.optional')}
                    value={form.deadline}
                    onChange={(v) => set('deadline', v)}
                  />
                  <p className="text-xs text-muted">
                    {t('admin.events.countInfo', { count: event.guestlist.count })}
                  </p>
                </>
              )}
            </div>
          </Card>

          <Card title={t('admin.events.tickets')}>
            <TextField
              label={t('admin.events.externalUrl')}
              hint={t('admin.common.optional')}
              placeholder="https://"
              value={form.externalUrl}
              onChange={(v) => set('externalUrl', v)}
            />
            <p className="mt-2 text-xs text-muted">{t('admin.events.ticketsDeferred')}</p>
          </Card>

          <button
            type="button"
            onClick={remove}
            className={buttonClass(
              'outline',
              'w-full border-accent/40 text-accent hover:border-accent',
            )}
          >
            <Trash2 className="size-4" aria-hidden="true" /> {t('admin.events.delete')}
          </button>
        </div>
      </div>

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setForm(initial)} />
    </>
  )
}
