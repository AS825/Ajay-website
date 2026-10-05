import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, setDoc } from 'firebase/firestore'
import { seedSite, type SiteSettings, type Tile } from '@ajay/shared'
import { adminDb } from '../firebase'
import { omitId, sameData, useDocData } from '../hooks'
import { Card, LocalizedField, PageHeader, Spinner, TextField } from '../ui/Kit'
import { MediaField } from '../ui/MediaField'
import { ImageList } from '../ui/ImageList'
import { LocalizedRichText } from '../ui/RichText'
import { SaveBar } from '../ui/SaveBar'
import { SortableList } from '../ui/SortableList'
import { toast } from '../ui/Toast'
import { SegmentedControl } from '../../components/ui/SegmentedControl'

type Tab = 'general' | 'about' | 'press' | 'tiles' | 'legal'
const isUrl = (s: string) => s === '' || s === 'TODO' || /^https?:\/\/\S+$/.test(s)

/** Texts & legal (SPEC §10.9) plus general site settings, tiles and press kit. Sections order lives in Design. */
export default function Content() {
  const { t } = useTranslation()
  const siteDoc = useDocData<SiteSettings>('settings/site')
  const initial = useMemo(
    () => (siteDoc === undefined ? null : { ...seedSite, ...(siteDoc ? omitId(siteDoc) : {}) }),
    [siteDoc],
  )
  const [site, setSite] = useState<SiteSettings | null>(null)
  const [tab, setTab] = useState<Tab>('general')
  const [saving, setSaving] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSite((cur) => cur ?? initial), [initial])

  if (!site || !initial) {
    return (
      <div className="grid h-64 place-items-center">
        <Spinner />
      </div>
    )
  }

  const set = (patch: Partial<SiteSettings>) => setSite((s) => (s ? { ...s, ...patch } : s))
  const setTile = (id: string, patch: Partial<Tile>) =>
    set({ tiles: site.tiles.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  // Sections are edited in Design; never overwrite them from here.
  const { sections: _sections, ...edited } = site
  const { sections: _initialSections, ...base } = initial
  const dirty = !sameData(edited, base)

  const save = async () => {
    if (!/^\S+@\S+\.\S+$/.test(site.bookingEmail))
      return toast(t('admin.content.invalidEmail'), 'error')
    if (
      ![
        site.spotifyArtistUrl,
        site.lectionUrl,
        site.supportUrl,
        ...site.tiles.map((x) => (x.href.startsWith('/') ? '' : x.href)),
      ].every(isUrl)
    ) {
      return toast(t('admin.links.invalid'), 'error')
    }
    setSaving(true)
    try {
      await setDoc(doc(adminDb, 'settings/site'), edited, { merge: true })
      toast(t('admin.common.saved'))
    } catch (err) {
      console.error(err)
      toast(t('admin.common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader title={t('admin.nav.content')} />
      <div className="no-scrollbar mb-4 overflow-x-auto">
        <SegmentedControl<Tab>
          label={t('admin.nav.content')}
          value={tab}
          onChange={setTab}
          options={(['general', 'about', 'press', 'tiles', 'legal'] as const).map((v) => ({
            value: v,
            label: t(`admin.content.tabs.${v}`),
          }))}
        />
      </div>

      {tab === 'general' && (
        <Card>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label={t('admin.content.artistName')}
              value={site.artistName}
              onChange={(artistName) => set({ artistName })}
            />
            <TextField
              label={t('admin.content.bookingEmail')}
              type="email"
              value={site.bookingEmail}
              onChange={(bookingEmail) => set({ bookingEmail })}
            />
            <TextField
              className="sm:col-span-2"
              label={t('admin.content.spotify')}
              hint={t('admin.content.spotifyHint')}
              value={site.spotifyArtistUrl}
              onChange={(spotifyArtistUrl) => set({ spotifyArtistUrl })}
            />
            <TextField
              label={t('admin.content.lection')}
              value={site.lectionUrl}
              onChange={(lectionUrl) => set({ lectionUrl })}
            />
            <TextField
              label={t('admin.content.support')}
              value={site.supportUrl}
              onChange={(supportUrl) => set({ supportUrl })}
            />
            <TextField
              className="sm:col-span-2"
              label={t('admin.content.genres')}
              hint={t('admin.content.genresHint')}
              value={site.genres.join(', ')}
              onChange={(v) =>
                set({
                  genres: v
                    .split(',')
                    .map((g) => g.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </Card>
      )}

      {tab === 'about' && (
        <div className="space-y-4">
          <Card>
            <div className="space-y-4">
              <LocalizedField
                label={t('admin.content.bioShort')}
                value={site.bioShort}
                onChange={(bioShort) => set({ bioShort })}
                multiline
                rows={4}
              />
              <LocalizedField
                label={t('admin.content.bioLong')}
                value={site.bioLong}
                onChange={(bioLong) => set({ bioLong })}
                multiline
                rows={10}
              />
            </div>
          </Card>
          <Card>
            <ImageList
              label={t('admin.content.aboutPhotos')}
              value={site.aboutPhotos}
              onChange={(aboutPhotos) => set({ aboutPhotos })}
              folder="photos"
              max={4}
            />
          </Card>
        </div>
      )}

      {tab === 'press' && (
        <div className="space-y-4">
          <Card>
            <MediaField
              kind="docs"
              label={t('admin.content.pressPdf')}
              hint={t('admin.content.pressPdfHint')}
              value={site.pressKitPdfUrl}
              onChange={(pressKitPdfUrl) => set({ pressKitPdfUrl })}
              folder="press"
              aspect="aspect-[3/4]"
            />
          </Card>
          <Card>
            <ImageList
              label={t('admin.content.pressPhotos')}
              value={site.pressPhotos}
              onChange={(pressPhotos) => set({ pressPhotos })}
              folder="press"
            />
          </Card>
        </div>
      )}

      {tab === 'tiles' && (
        <Card>
          <p className="mb-3 text-sm text-muted">{t('admin.content.tilesHint')}</p>
          <SortableList
            items={site.tiles}
            onReorder={(tiles) => set({ tiles })}
            render={(tile) => (
              <details className="group">
                <summary className="flex min-h-11 cursor-pointer list-none items-center gap-3">
                  {tile.imageUrl ? (
                    <img
                      src={tile.imageUrl}
                      alt=""
                      className="size-10 rounded-[10px] object-cover"
                    />
                  ) : (
                    <span className="size-10 rounded-[10px] bg-white/[0.06]" />
                  )}
                  <span className="font-bold tracking-tight">{tile.title}</span>
                  <span className="truncate text-xs text-muted">{tile.href}</span>
                </summary>
                <div className="mt-3 grid gap-3 pb-2">
                  <TextField
                    label={t('admin.links.title')}
                    value={tile.title}
                    onChange={(title) => setTile(tile.id, { title })}
                  />
                  <LocalizedField
                    label={t('admin.links.subtitle')}
                    value={tile.subtitle}
                    onChange={(subtitle) => setTile(tile.id, { subtitle })}
                  />
                  <TextField
                    label={t('admin.content.tileHref')}
                    hint={t('admin.content.tileHrefHint')}
                    value={tile.href}
                    onChange={(href) => setTile(tile.id, { href })}
                  />
                  <MediaField
                    label={t('admin.content.tileImage')}
                    value={tile.imageUrl ?? ''}
                    onChange={(imageUrl) => setTile(tile.id, { imageUrl })}
                    folder="tiles"
                    image={{ aspect: 16 / 11, maxSize: 1400 }}
                    aspect="aspect-[16/11]"
                  />
                </div>
              </details>
            )}
          />
        </Card>
      )}

      {tab === 'legal' && (
        <div className="space-y-4">
          <p className="rounded-[18px] border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            {t('admin.content.legalHint')}
          </p>
          <Card>
            <LocalizedRichText
              label={t('legal.imprint')}
              value={site.legal.impressum}
              onChange={(impressum) => set({ legal: { ...site.legal, impressum } })}
            />
          </Card>
          <Card>
            <LocalizedRichText
              label={t('legal.privacy')}
              value={site.legal.datenschutz}
              onChange={(datenschutz) => set({ legal: { ...site.legal, datenschutz } })}
            />
          </Card>
          <Card>
            <LocalizedRichText
              label={t('legal.terms')}
              value={site.legal.agb}
              onChange={(agb) => set({ legal: { ...site.legal, agb } })}
            />
          </Card>
        </div>
      )}

      <SaveBar dirty={dirty} saving={saving} onSave={save} onReset={() => setSite(initial)} />
    </>
  )
}
