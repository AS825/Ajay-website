import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { Eye, EyeOff, Minus, Plus, Smartphone, X } from 'lucide-react'
import {
  normalizeSections,
  seedSite,
  seedTheme,
  type BackgroundType,
  type SectionConfig,
  type SiteSettings,
  type ThemeSettings,
} from '@ajay/shared'
import { adminDb } from '../firebase'
import { omitId, sameData, useDocData } from '../hooks'
import { Card, Label, LocalizedField, PageHeader, Spinner, TextField } from '../ui/Kit'
import { MediaField } from '../ui/MediaField'
import { SaveBar } from '../ui/SaveBar'
import { SortableList } from '../ui/SortableList'
import { toast } from '../ui/Toast'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { buttonClass } from '../../components/ui/Button'
import { PREVIEW_READY, PREVIEW_STATE, type PreviewState } from '../../lib/preview'
import { useMediaQuery } from '../../lib/hooks'

const SWATCHES = [
  '#FF2D2D',
  '#FF6B00',
  '#FFD60A',
  '#00E676',
  '#00B8FF',
  '#7C4DFF',
  '#FF2DAA',
  '#FFFFFF',
]
const HEX = /^#[0-9a-f]{6}$/i

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const id = useId()
  const [text, setText] = useState(value)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setText(value), [value])
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="color"
          value={HEX.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="size-12 shrink-0 cursor-pointer rounded-full border border-hairline bg-transparent p-1"
        />
        <input
          value={text}
          aria-label={`${label} (Hex)`}
          onChange={(e) => {
            setText(e.target.value)
            if (HEX.test(e.target.value)) onChange(e.target.value.toUpperCase())
          }}
          className="min-h-12 w-28 rounded-[16px] border border-hairline bg-white/[0.06] px-3 font-mono text-sm uppercase"
        />
      </div>
    </div>
  )
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format: (v: number) => string
}) {
  const id = useId()
  return (
    <div>
      <Label htmlFor={id} hint={format(value)}>
        {label}
      </Label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-12 w-full accent-[var(--accent)]"
      />
    </div>
  )
}

/** Phone-frame preview: renders the real site in an iframe and pushes the unsaved state into it. */
function PhonePreview({ state }: { state: PreviewState }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const post = useCallback(
    () => frame.current?.contentWindow?.postMessage(state, window.location.origin),
    [state],
  )
  useEffect(post, [post])
  useEffect(() => {
    const onMessage = (e: MessageEvent) =>
      e.origin === window.location.origin && e.data?.type === PREVIEW_READY && post()
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [post])
  return (
    <div className="mx-auto w-[300px] rounded-[48px] border-[10px] border-neutral-800 bg-black shadow-soft">
      <div className="relative h-[600px] overflow-hidden rounded-[38px]">
        {/* 390×780 viewport scaled to the frame */}
        <iframe
          ref={frame}
          src="/?preview=1"
          title="Preview"
          className="absolute top-0 left-0 h-[780px] w-[390px] origin-top-left border-0"
          style={{ transform: 'scale(0.7179)' }}
        />
      </div>
    </div>
  )
}

/** Theme editor (SPEC §10.2): background, hero, accent, logo, marquee, sections + live preview, then publish. */
export default function Design() {
  const { t } = useTranslation()
  const themeDoc = useDocData<ThemeSettings>('settings/theme')
  const siteDoc = useDocData<SiteSettings>('settings/site')
  const [theme, setTheme] = useState<ThemeSettings | null>(null)
  const [sections, setSections] = useState<SectionConfig[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  // Only one preview iframe at a time (each one loads the whole site).
  const wide = useMediaQuery('(min-width: 1024px)')

  const initialTheme = useMemo(
    () => (themeDoc === undefined ? null : { ...seedTheme, ...(themeDoc ? omitId(themeDoc) : {}) }),
    [themeDoc],
  )
  const initialSections = useMemo(
    () =>
      siteDoc === undefined ? null : normalizeSections(siteDoc?.sections ?? seedSite.sections),
    [siteDoc],
  )
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setTheme((cur) => cur ?? initialTheme), [initialTheme])
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSections((cur) => cur ?? initialSections), [initialSections])

  if (!theme || !sections) {
    return (
      <div className="grid h-64 place-items-center">
        <Spinner />
      </div>
    )
  }

  const themeData = theme
  const dirty = !sameData(theme, initialTheme) || !sameData(sections, initialSections)
  const setT = (patch: Partial<ThemeSettings>) => setTheme((x) => (x ? { ...x, ...patch } : x))
  const setBg = (patch: Partial<ThemeSettings['background']>) =>
    setT({ background: { ...theme.background, ...patch } })
  const setHero = (patch: Partial<ThemeSettings['hero']>) =>
    setT({ hero: { ...theme.hero, ...patch } })

  const publish = async () => {
    if (!HEX.test(theme.accentColor)) return toast(t('admin.design.invalidColor'), 'error')
    setSaving(true)
    try {
      await setDoc(doc(adminDb, 'settings/theme'), themeData)
      await updateDoc(doc(adminDb, 'settings/site'), { sections })
      toast(t('admin.design.published'))
    } catch (err) {
      console.error(err)
      toast(t('admin.common.error'), 'error')
    } finally {
      setSaving(false)
    }
  }
  const reset = () => {
    setTheme(initialTheme)
    setSections(initialSections)
  }

  const previewState: PreviewState = { type: PREVIEW_STATE, theme: themeData, sections }
  const gradient = theme.background.gradient

  return (
    <>
      <PageHeader
        title={t('admin.nav.design')}
        subtitle={t('admin.design.subtitle')}
        actions={
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className={buttonClass('glass', 'lg:hidden', 'sm')}
          >
            <Smartphone className="size-4" aria-hidden="true" /> {t('admin.design.preview')}
          </button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card title={t('admin.design.brand')}>
            <div className="space-y-4">
              <ColorField
                label={t('admin.design.accent')}
                value={theme.accentColor}
                onChange={(accentColor) => setT({ accentColor })}
              />
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label={t('admin.design.presets')}
              >
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setT({ accentColor: c })}
                    className={`pressable size-9 rounded-full border-2 ${theme.accentColor.toUpperCase() === c ? 'border-white' : 'border-transparent'}`}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
              <MediaField
                label={t('admin.design.logo')}
                hint={t('admin.design.logoHint')}
                value={theme.logoUrl}
                onChange={(logoUrl) => setT({ logoUrl })}
                folder="theme"
                image={{ maxSize: 800 }}
                aspect="aspect-[2/1]"
              />
              <TextField
                label={t('admin.design.marquee')}
                value={theme.marqueeText}
                onChange={(marqueeText) => setT({ marqueeText })}
              />
            </div>
          </Card>

          <Card title={t('admin.design.hero')}>
            <div className="space-y-4">
              <TextField
                label={t('admin.design.headline')}
                value={theme.hero.headline}
                onChange={(headline) => setHero({ headline })}
              />
              <LocalizedField
                label={t('admin.design.subline')}
                value={theme.hero.subline}
                onChange={(subline) => setHero({ subline })}
              />
              <LocalizedField
                label={t('admin.design.quote')}
                value={theme.hero.quote}
                onChange={(quote) => setHero({ quote })}
              />
              <SegmentedControl
                label={t('admin.design.heroMedia')}
                value={theme.hero.mediaType}
                onChange={(mediaType) => setHero({ mediaType })}
                options={[
                  { value: 'none', label: t('admin.design.none') },
                  { value: 'image', label: t('admin.design.image') },
                  { value: 'video', label: t('admin.design.video') },
                ]}
              />
              {theme.hero.mediaType === 'image' && (
                <MediaField
                  label={t('admin.design.heroImage')}
                  value={theme.hero.imageUrl}
                  onChange={(imageUrl) => setHero({ imageUrl })}
                  folder="theme"
                  image={{ maxSize: 2400 }}
                  aspect="aspect-[9/16]"
                />
              )}
              {theme.hero.mediaType === 'video' && (
                <>
                  <MediaField
                    kind="videos"
                    label={t('admin.design.heroVideo')}
                    hint={t('admin.design.videoHint')}
                    value={theme.hero.videoUrl}
                    onChange={(videoUrl) => setHero({ videoUrl })}
                    folder="theme"
                    aspect="aspect-[9/16]"
                  />
                  <MediaField
                    label={t('admin.design.poster')}
                    hint={t('admin.design.posterHint')}
                    value={theme.hero.posterUrl}
                    onChange={(posterUrl) => setHero({ posterUrl })}
                    folder="theme"
                    image={{ maxSize: 1600 }}
                    aspect="aspect-[9/16]"
                  />
                </>
              )}
            </div>
          </Card>

          <Card title={t('admin.design.background')}>
            <div className="space-y-4">
              <SegmentedControl<BackgroundType>
                label={t('admin.design.background')}
                value={theme.background.type}
                onChange={(type) => setBg({ type })}
                options={[
                  { value: 'color', label: t('admin.design.color') },
                  { value: 'gradient', label: t('admin.design.gradient') },
                  { value: 'image', label: t('admin.design.image') },
                  { value: 'video', label: t('admin.design.video') },
                ]}
              />
              {theme.background.type === 'color' && (
                <ColorField
                  label={t('admin.design.color')}
                  value={theme.background.color}
                  onChange={(color) => setBg({ color })}
                />
              )}
              {theme.background.type === 'gradient' && (
                <>
                  <div className="flex flex-wrap items-end gap-4">
                    {gradient.colors.map((c, i) => (
                      <ColorField
                        key={i}
                        label={`${t('admin.design.color')} ${i + 1}`}
                        value={c}
                        onChange={(v) =>
                          setBg({
                            gradient: {
                              ...gradient,
                              colors: gradient.colors.map((x, j) => (j === i ? v : x)),
                            },
                          })
                        }
                      />
                    ))}
                    <div className="flex gap-1 pb-0.5">
                      <button
                        type="button"
                        disabled={gradient.colors.length <= 2}
                        onClick={() =>
                          setBg({ gradient: { ...gradient, colors: gradient.colors.slice(0, -1) } })
                        }
                        className={buttonClass('glass', 'disabled:opacity-30', 'icon')}
                        aria-label={t('admin.design.removeColor')}
                      >
                        <Minus className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={gradient.colors.length >= 3}
                        onClick={() =>
                          setBg({
                            gradient: { ...gradient, colors: [...gradient.colors, '#000000'] },
                          })
                        }
                        className={buttonClass('glass', 'disabled:opacity-30', 'icon')}
                        aria-label={t('admin.design.addColor')}
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                  </div>
                  <Slider
                    label={t('admin.design.angle')}
                    value={gradient.angle}
                    min={0}
                    max={360}
                    step={5}
                    onChange={(angle) => setBg({ gradient: { ...gradient, angle } })}
                    format={(v) => `${v}°`}
                  />
                  <div
                    className="h-16 rounded-[16px] border border-hairline"
                    style={{
                      background: `linear-gradient(${gradient.angle}deg, ${gradient.colors.join(', ')})`,
                    }}
                    aria-hidden="true"
                  />
                </>
              )}
              {(theme.background.type === 'image' || theme.background.type === 'video') && (
                <>
                  <MediaField
                    kind={theme.background.type === 'image' ? 'images' : 'videos'}
                    label={
                      theme.background.type === 'image'
                        ? t('admin.design.image')
                        : t('admin.design.video')
                    }
                    value={theme.background.mediaUrl}
                    onChange={(mediaUrl) => setBg({ mediaUrl })}
                    folder="theme"
                    image={{ maxSize: 2400 }}
                    aspect="aspect-[9/16]"
                  />
                  <Slider
                    label={t('admin.design.overlay')}
                    value={Math.max(0.4, theme.background.overlayOpacity)}
                    min={0.4}
                    max={0.95}
                    step={0.05}
                    onChange={(overlayOpacity) => setBg({ overlayOpacity })}
                    format={(v) => `${Math.round(v * 100)} %`}
                  />
                  <p className="text-xs text-muted">{t('admin.design.overlayHint')}</p>
                </>
              )}
            </div>
          </Card>

          <Card title={t('admin.design.sections')}>
            <p className="mb-3 text-sm text-muted">{t('admin.design.sectionsHint')}</p>
            <SortableList
              items={sections}
              onReorder={setSections}
              render={(s) => (
                <div className={`flex items-center gap-3 ${s.visible ? '' : 'opacity-50'}`}>
                  <span className="flex-1 font-semibold">
                    {t(`admin.design.sectionNames.${s.id}`)}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setSections((list) =>
                        list!.map((x) => (x.id === s.id ? { ...x, visible: !x.visible } : x)),
                      )
                    }
                    className={buttonClass('glass', '', 'icon')}
                    aria-pressed={s.visible}
                    aria-label={`${t(`admin.design.sectionNames.${s.id}`)}: ${s.visible ? t('admin.links.visible') : t('admin.design.hidden')}`}
                  >
                    {s.visible ? (
                      <Eye className="size-5" aria-hidden="true" />
                    ) : (
                      <EyeOff className="size-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
              )}
            />
          </Card>
        </div>

        {wide && (
          <aside>
            <div className="sticky top-20">
              <p className="eyebrow mb-3 text-center">{t('admin.design.livePreview')}</p>
              <PhonePreview state={previewState} />
            </div>
          </aside>
        )}
      </div>

      {showPreview && !wide && (
        <div
          className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-black/90 p-4 backdrop-blur-xl lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={t('admin.design.livePreview')}
        >
          <PhonePreview state={previewState} />
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className={buttonClass('glass', '', 'sm')}
          >
            <X className="size-4" aria-hidden="true" /> {t('admin.common.close')}
          </button>
        </div>
      )}

      <SaveBar
        dirty={dirty}
        saving={saving}
        onSave={publish}
        onReset={reset}
        saveLabel={t('admin.design.publish')}
      />
    </>
  )
}
