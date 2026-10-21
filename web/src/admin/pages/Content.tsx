import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, setDoc } from 'firebase/firestore'
import { Plus, Trash2 } from 'lucide-react'
import {
  isTodo,
  seedSite,
  type IconKey,
  type Localized,
  type SiteSettings,
  type StatItem,
} from '@ajay/shared'
import { adminDb } from '../firebase'
import { omitId, sameData, useDocData } from '../hooks'
import { Card, LocalizedField, PageHeader, Select, Spinner, TextField } from '../ui/Kit'
import { MediaField } from '../ui/MediaField'
import { ImageList } from '../ui/ImageList'
import { LocalizedRichText } from '../ui/RichText'
import { SaveBar } from '../ui/SaveBar'
import { toast } from '../ui/Toast'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { buttonClass } from '../../components/ui/Button'

type Tab = 'general' | 'about' | 'press' | 'legal'
const STAT_ICONS: IconKey[] = [
  'spotify',
  'youtube',
  'instagram',
  'tiktok',
  'soundcloud',
  'twitch',
  'mixcloud',
  'applemusic',
  'deezer',
  'bandcamp',
]
const lines = (v: string) =>
  v
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

/** Facts are edited as one line per fact; German line n translates English line n. */
function factsFromLines(en: string, de: string): Localized[] {
  const deLines = de.split('\n').map((l) => l.trim())
  return lines(en).map((line, i) => (deLines[i] ? { en: line, de: deLines[i] } : { en: line }))
}

const isUrl = (s: string) => s === '' || s === 'TODO' || /^https?:\/\/\S+$/.test(s)

/** Texts & legal (SPEC §10.9) plus general site settings and the press-kit blocks. Sections order lives in Design. */
export default function Content() {
  const { t } = useTranslation()
  const siteDoc = useDocData<SiteSettings>('settings/site')
  const initial = useMemo(() => {
    if (siteDoc === undefined) return null
    const merged = { ...seedSite, ...(siteDoc ? omitId(siteDoc) : {}) }
    // Same fallback as the website: the placeholder bio shows the press-kit text.
    if (isTodo(merged.bioShort.en)) merged.bioShort = seedSite.bioShort
    return merged
  }, [siteDoc])
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
  const setStat = (i: number, patch: Partial<StatItem>) =>
    set({ stats: site.stats.map((x, j) => (j === i ? { ...x, ...patch } : x)) })
  // Sections are edited in Design; never overwrite them from here.
  const { sections: _sections, ...edited } = site
  const { sections: _initialSections, ...base } = initial
  const dirty = !sameData(edited, base)

  const save = async () => {
    if (!/^\S+@\S+\.\S+$/.test(site.bookingEmail))
      return toast(t('admin.content.invalidEmail'), 'error')
    if (![site.spotifyArtistUrl, site.lectionUrl, site.supportUrl, site.liveSetsUrl].every(isUrl)) {
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
          options={(['general', 'about', 'press', 'legal'] as const).map((v) => ({
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
          <Card title={t('admin.content.factsTitle')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={t('admin.content.factsEn')}
                hint={t('admin.content.onePerLine')}
                multiline
                rows={9}
                value={site.facts.map((f) => f.en).join('\n')}
                onChange={(v) =>
                  set({ facts: factsFromLines(v, site.facts.map((f) => f.de ?? '').join('\n')) })
                }
              />
              <TextField
                label={t('admin.content.factsDe')}
                hint={t('admin.content.factsDeHint')}
                multiline
                rows={9}
                value={site.facts.map((f) => f.de ?? '').join('\n')}
                onChange={(v) =>
                  set({ facts: factsFromLines(site.facts.map((f) => f.en).join('\n'), v) })
                }
              />
              <div className="sm:col-span-2">
                <MediaField
                  label={t('admin.content.infoPhoto')}
                  value={site.infoPhoto}
                  onChange={(infoPhoto) => set({ infoPhoto })}
                  folder="press"
                  image={{ aspect: 1, maxSize: 1400 }}
                  aspect="aspect-square"
                />
              </div>
            </div>
          </Card>
          <Card title={t('admin.content.statsTitle')}>
            <ul className="space-y-4">
              {site.stats.map((stat, i) => (
                <li
                  key={i}
                  className="grid gap-3 rounded-[16px] border border-hairline p-3 sm:grid-cols-[10rem_1fr_8rem_auto] sm:items-end"
                >
                  <Select<IconKey>
                    label={t('admin.content.statPlatform')}
                    value={stat.icon}
                    onChange={(icon) => setStat(i, { icon })}
                    options={STAT_ICONS.map((v) => ({ value: v, label: v }))}
                  />
                  <LocalizedField
                    label={t('admin.content.statLabel')}
                    value={stat.label}
                    onChange={(label) => setStat(i, { label })}
                  />
                  <TextField
                    label={t('admin.content.statValue')}
                    placeholder="8M+"
                    value={stat.value}
                    onChange={(value) => setStat(i, { value })}
                  />
                  <TextField
                    className="sm:col-span-4"
                    label={t('admin.content.statUrl')}
                    placeholder="https://"
                    value={stat.url ?? ''}
                    onChange={(url) => setStat(i, { url })}
                  />
                  <button
                    type="button"
                    onClick={() => set({ stats: site.stats.filter((_, j) => j !== i) })}
                    className={buttonClass('glass', '', 'icon')}
                    aria-label={t('admin.common.delete')}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                set({ stats: [...site.stats, { icon: 'spotify', label: { en: '' }, value: '' }] })
              }
              className={buttonClass('glass', 'mt-4', 'sm')}
            >
              <Plus className="size-4" aria-hidden="true" /> {t('admin.content.statAdd')}
            </button>
          </Card>
          <Card title={t('admin.content.artistsTitle')}>
            <div className="space-y-4">
              <TextField
                label={t('admin.content.artistsList')}
                hint={t('admin.content.onePerLine')}
                multiline
                rows={10}
                value={site.artists.join('\n')}
                onChange={(v) => set({ artists: lines(v) })}
              />
              <MediaField
                label={t('admin.content.artistsPhoto')}
                value={site.artistsPhoto}
                onChange={(artistsPhoto) => set({ artistsPhoto })}
                folder="press"
                image={{ maxSize: 1400 }}
                aspect="aspect-[3/4]"
              />
            </div>
          </Card>
          <Card title={t('admin.content.producedTitle')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={t('admin.content.remixes')}
                hint={t('admin.content.onePerLine')}
                multiline
                rows={10}
                value={site.productions.remixes.join('\n')}
                onChange={(v) => set({ productions: { ...site.productions, remixes: lines(v) } })}
              />
              <TextField
                label={t('admin.content.tracks')}
                hint={t('admin.content.onePerLine')}
                multiline
                rows={10}
                value={site.productions.tracks.join('\n')}
                onChange={(v) => set({ productions: { ...site.productions, tracks: lines(v) } })}
              />
              <div className="sm:col-span-2">
                <MediaField
                  label={t('admin.content.producedPhoto')}
                  value={site.producedPhoto}
                  onChange={(producedPhoto) => set({ producedPhoto })}
                  folder="press"
                  image={{ maxSize: 1200 }}
                  aspect="aspect-square"
                />
              </div>
            </div>
          </Card>
          <Card title={t('admin.content.riderTitle')}>
            <div className="space-y-4">
              <TextField
                label={t('admin.content.riderGear')}
                hint={t('admin.content.onePerLine')}
                multiline
                rows={4}
                value={site.rider.gear.join('\n')}
                onChange={(v) => set({ rider: { ...site.rider, gear: lines(v) } })}
              />
              <LocalizedField
                label={t('admin.content.riderNote')}
                value={site.rider.note}
                onChange={(note) => set({ rider: { ...site.rider, note } })}
                multiline
                rows={3}
              />
              <MediaField
                label={t('admin.content.riderPhoto')}
                value={site.riderPhoto}
                onChange={(riderPhoto) => set({ riderPhoto })}
                folder="press"
                image={{ maxSize: 1800 }}
                aspect="aspect-[2/1]"
              />
            </div>
          </Card>
          <Card>
            <div className="space-y-4">
              <TextField
                label={t('admin.content.liveSets')}
                value={site.liveSetsUrl}
                onChange={(liveSetsUrl) => set({ liveSetsUrl })}
              />
              <TextField
                label={t('admin.content.pressKitUrl')}
                value={site.pressKitUrl}
                onChange={(pressKitUrl) => set({ pressKitUrl })}
              />
              <TextField
                label={t('admin.content.guestlistUrl')}
                hint={t('admin.content.guestlistUrlHint')}
                value={site.guestlistUrl}
                onChange={(guestlistUrl) => set({ guestlistUrl })}
              />
              <TextField
                label={t('admin.content.contactUrl')}
                hint={t('admin.content.contactUrlHint')}
                value={site.contactUrl}
                onChange={(contactUrl) => set({ contactUrl })}
              />
              <MediaField
                label={t('admin.content.contactPhoto')}
                value={site.contactPhoto}
                onChange={(contactPhoto) => set({ contactPhoto })}
                folder="press"
                image={{ maxSize: 1400 }}
                aspect="aspect-[4/5]"
              />
            </div>
          </Card>
          <Card title={t('admin.content.venuesTitle')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={t('venues.austria')}
                hint={t('admin.content.onePerLine')}
                multiline
                rows={10}
                value={site.venues.austria.join('\n')}
                onChange={(v) => set({ venues: { ...site.venues, austria: lines(v) } })}
              />
              <TextField
                label={t('venues.international')}
                hint={t('admin.content.onePerLine')}
                multiline
                rows={10}
                value={site.venues.international.join('\n')}
                onChange={(v) => set({ venues: { ...site.venues, international: lines(v) } })}
              />
              <div className="sm:col-span-2">
                <MediaField
                  label={t('admin.content.venuesPhoto')}
                  value={site.venuesPhoto}
                  onChange={(venuesPhoto) => set({ venuesPhoto })}
                  folder="press"
                  image={{ aspect: 3 / 5, maxSize: 1400 }}
                  aspect="aspect-[3/5] max-w-56"
                />
              </div>
            </div>
          </Card>
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
