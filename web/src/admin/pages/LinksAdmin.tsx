import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  orderBy,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { Eye, EyeOff, Pencil, Plus } from 'lucide-react'
import type { IconKey, LinkCategory, LinkDoc } from '@ajay/shared'
import { adminDb } from '../firebase'
import { useCollectionData, type WithId } from '../hooks'
import { Empty, LocalizedField, PageHeader, Select, Spinner, TextField, Toggle } from '../ui/Kit'
import { MediaField } from '../ui/MediaField'
import { SortableList } from '../ui/SortableList'
import { toast } from '../ui/Toast'
import { SocialIcon } from '../../components/ui/SocialIcon'
import { BottomSheet } from '../../components/ui/BottomSheet'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { buttonClass } from '../../components/ui/Button'

const CATEGORIES: LinkCategory[] = ['social', 'streaming', 'sets', 'drops']
const ICONS: IconKey[] = [
  'link',
  'instagram',
  'tiktok',
  'youtube',
  'twitch',
  'soundcloud',
  'mixcloud',
  'bandcamp',
  'spotify',
  'applemusic',
  'amazonmusic',
  'deezer',
  'linktree',
  'paypal',
]

type Draft = Omit<LinkDoc, 'order'> & { id?: string }

function LinkEditor({ draft, onClose }: { draft: Draft; onClose: () => void }) {
  const { t } = useTranslation()
  const [d, setD] = useState<Draft>(draft)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))

  const save = async () => {
    if (!d.title.trim() || !/^https?:\/\/\S+$/.test(d.url.trim()))
      return toast(t('admin.links.invalid'), 'error')
    setBusy(true)
    const { id, ...data } = { ...d, title: d.title.trim(), url: d.url.trim() }
    try {
      if (id) await updateDoc(doc(adminDb, 'links', id), data)
      else await addDoc(collection(adminDb, 'links'), { ...data, order: Date.now() })
      toast(t('admin.common.saved'))
      onClose()
    } catch {
      toast(t('admin.common.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 pb-2">
      <TextField label={t('admin.links.title')} value={d.title} onChange={(v) => set('title', v)} />
      <LocalizedField
        label={t('admin.links.subtitle')}
        value={d.subtitle}
        onChange={(v) => set('subtitle', v)}
      />
      <TextField
        label="URL"
        type="url"
        inputMode="url"
        placeholder="https://"
        value={d.url}
        onChange={(v) => set('url', v)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Select<LinkCategory>
          label={t('admin.links.category')}
          value={d.category}
          onChange={(v) => set('category', v)}
          options={CATEGORIES.map((c) => ({ value: c, label: t(`admin.links.categories.${c}`) }))}
        />
        <Select<IconKey>
          label={t('admin.links.icon')}
          value={d.icon ?? 'link'}
          onChange={(v) => set('icon', v)}
          options={ICONS.map((i) => ({ value: i, label: i }))}
        />
      </div>
      {(d.category === 'drops' || d.category === 'sets') && (
        <MediaField
          label={t('admin.links.cover')}
          value={d.coverUrl ?? ''}
          onChange={(v) => set('coverUrl', v)}
          folder="covers"
          image={{ aspect: d.category === 'drops' ? 1 : 16 / 9, maxSize: 1200 }}
          aspect={d.category === 'drops' ? 'aspect-square' : 'aspect-video'}
        />
      )}
      <Toggle
        checked={d.visible}
        onChange={(v) => set('visible', v)}
        label={t('admin.links.visible')}
      />
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={buttonClass('primary', 'flex-1')}
        >
          {t('admin.common.save')}
        </button>
        {d.id && (
          <button
            type="button"
            onClick={async () => {
              if (!window.confirm(t('admin.links.confirmDelete', { title: d.title }))) return
              await deleteDoc(doc(adminDb, 'links', d.id!)).then(
                () => (toast(t('admin.common.deleted')), onClose()),
              )
            }}
            className={buttonClass('outline', 'text-accent')}
          >
            {t('admin.common.delete')}
          </button>
        )}
      </div>
    </div>
  )
}

/** Links & drops (SPEC §10.3): CRUD, drag & drop order, visibility, covers. */
export default function LinksAdmin() {
  const { t } = useTranslation()
  const [category, setCategory] = useState<LinkCategory>('social')
  const links = useCollectionData<LinkDoc>('links', [orderBy('order')], 'byOrder')
  const [local, setLocal] = useState<WithId<LinkDoc>[] | null>(null)
  const [editing, setEditing] = useState<Draft | null>(null)

  // Drop the optimistic order once the server confirms it.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setLocal(null), [links])

  const list = (local ?? links ?? []).filter((l) => l.category === category)

  const reorder = async (items: WithId<LinkDoc>[]) => {
    const others = (links ?? []).filter((l) => l.category !== category)
    setLocal([...others, ...items])
    const batch = writeBatch(adminDb)
    items.forEach((l, i) => batch.update(doc(adminDb, 'links', l.id), { order: (i + 1) * 10 }))
    await batch.commit().catch(() => toast(t('admin.common.error'), 'error'))
  }

  return (
    <>
      <PageHeader
        title={t('admin.nav.links')}
        subtitle={t('admin.links.subtitleHint')}
        actions={
          <button
            type="button"
            onClick={() =>
              setEditing({ title: '', url: '', category, icon: 'link', visible: true })
            }
            className={buttonClass('primary', '', 'sm')}
          >
            <Plus className="size-4" aria-hidden="true" /> {t('admin.links.add')}
          </button>
        }
      />
      <div className="no-scrollbar mb-4 overflow-x-auto">
        <SegmentedControl
          label={t('admin.links.category')}
          value={category}
          onChange={setCategory}
          options={CATEGORIES.map((c) => ({ value: c, label: t(`admin.links.categories.${c}`) }))}
        />
      </div>
      {!links ? (
        <div className="grid h-40 place-items-center">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <Empty>{t('admin.links.empty')}</Empty>
      ) : (
        <SortableList
          items={list}
          onReorder={reorder}
          render={(l) => (
            <div className={`flex items-center gap-3 ${l.visible ? '' : 'opacity-50'}`}>
              {l.coverUrl ? (
                <img
                  src={l.coverUrl}
                  alt=""
                  className="size-10 shrink-0 rounded-[10px] object-cover"
                />
              ) : (
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/[0.06]">
                  <SocialIcon icon={l.icon} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold">{l.title}</span>
                <span className="block truncate text-xs text-muted">{l.url}</span>
              </span>
              <button
                type="button"
                onClick={() => updateDoc(doc(adminDb, 'links', l.id), { visible: !l.visible })}
                className={buttonClass('glass', '', 'icon')}
                aria-label={
                  l.visible
                    ? t('admin.links.hide', { title: l.title })
                    : t('admin.links.show', { title: l.title })
                }
                aria-pressed={l.visible}
              >
                {l.visible ? (
                  <Eye className="size-5" aria-hidden="true" />
                ) : (
                  <EyeOff className="size-5" aria-hidden="true" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditing(l)}
                className={buttonClass('glass', '', 'icon')}
                aria-label={`${t('admin.common.edit')}: ${l.title}`}
              >
                <Pencil className="size-5" aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}
      <BottomSheet
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? t('admin.links.edit') : t('admin.links.add')}
      >
        {editing && (
          <LinkEditor key={editing.id ?? 'new'} draft={editing} onClose={() => setEditing(null)} />
        )}
      </BottomSheet>
    </>
  )
}
