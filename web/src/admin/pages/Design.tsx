import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, setDoc, updateDoc } from 'firebase/firestore'
import { Eye, EyeOff, Smartphone, X } from 'lucide-react'
import {
  normalizeSections,
  seedSite,
  seedTheme,
  type SectionConfig,
  type SiteSettings,
  type ThemeSettings,
} from '@ajay/shared'
import { adminDb } from '../firebase'
import { omitId, sameData, useDocData } from '../hooks'
import { Card, LocalizedField, PageHeader, Spinner } from '../ui/Kit'
import { MediaField } from '../ui/MediaField'
import { SaveBar } from '../ui/SaveBar'
import { SortableList } from '../ui/SortableList'
import { toast } from '../ui/Toast'
import { buttonClass } from '../../components/ui/Button'
import { PREVIEW_READY, PREVIEW_STATE, type PreviewState } from '../../lib/preview'
import { useMediaQuery } from '../../lib/hooks'

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

/** Design editor: logo, cover (portrait + two lines), order of the press-kit blocks, live preview. */
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
  const setHero = (patch: Partial<ThemeSettings['hero']>) =>
    setT({ hero: { ...theme.hero, ...patch } })

  const publish = async () => {
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
            <MediaField
              label={t('admin.design.logo')}
              hint={t('admin.design.logoHint')}
              value={theme.logoUrl}
              onChange={(logoUrl) => setT({ logoUrl })}
              folder="theme"
              image={{ maxSize: 800 }}
              aspect="aspect-[2/1]"
            />
            <p className="mt-2 text-xs text-muted">{t('admin.design.defaultHint')}</p>
          </Card>

          <Card title={t('admin.design.hero')}>
            <div className="space-y-4">
              <MediaField
                label={t('admin.design.heroImage')}
                hint={t('admin.design.heroImageHint')}
                value={theme.hero.imageUrl}
                onChange={(imageUrl) => setHero({ imageUrl })}
                folder="theme"
                image={{ maxSize: 2400 }}
                aspect="aspect-[9/16]"
              />
              <LocalizedField
                label={t('admin.design.line1')}
                value={theme.hero.subline}
                onChange={(subline) => setHero({ subline })}
              />
              <LocalizedField
                label={t('admin.design.line2')}
                value={theme.hero.quote}
                onChange={(quote) => setHero({ quote })}
              />
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
