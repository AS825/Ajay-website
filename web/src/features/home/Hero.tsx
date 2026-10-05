import { useTranslation } from 'react-i18next'
import { ArrowDown } from 'lucide-react'
import { localize } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { ButtonLink } from '../../components/ui/Button'

/** Full-screen hero (SPEC §4.1). Ken Burns, moving gradient and animated grain follow in Phase 2. */
export function Hero() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { theme } = useSiteData()
  const h = theme.hero

  return (
    <section
      aria-label={h.headline}
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
    >
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        {h.mediaType === 'video' && h.videoUrl ? (
          <video
            className="size-full object-cover"
            src={h.videoUrl}
            poster={h.posterUrl || undefined}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : h.mediaType === 'image' && h.imageUrl ? (
          <img className="size-full object-cover" src={h.imageUrl} alt="" fetchPriority="high" />
        ) : (
          // TODO(Ajay): hero photo/video. Until then an accent glow on black.
          <div
            className="size-full"
            style={{
              background:
                'radial-gradient(70% 55% at 75% 25%, color-mix(in srgb, var(--accent) 70%, transparent), transparent 70%), radial-gradient(60% 50% at 10% 80%, color-mix(in srgb, var(--accent) 30%, transparent), transparent 70%), #000',
            }}
          />
        )}
        <div className="grain absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black" />
      </div>

      <div
        className="px-safe mx-auto w-full max-w-6xl pb-10 md:pb-20"
        style={{ paddingTop: 'calc(var(--header-h) + var(--safe-top) + 2rem)' }}
      >
        <p className="eyebrow mb-4 text-white/80">{localize(h.subline, lang)}</p>
        <h1 className="display-xl mb-6 uppercase">{h.headline}</h1>
        <blockquote className="mb-10 max-w-xl text-2xl leading-tight font-semibold tracking-tight text-white/90 md:text-4xl">
          „{localize(h.quote, lang)}“
        </blockquote>
        <div className="flex flex-col gap-3 sm:flex-row">
          <ButtonLink href="/#events" variant="primary">
            {t('hero.ctaEvents')}
          </ButtonLink>
          <ButtonLink href="/booking" variant="glass">
            {t('hero.ctaBooking')}
          </ButtonLink>
        </div>
        <ArrowDown
          className="mx-auto mt-10 hidden size-5 text-white/50 md:block"
          aria-label={t('hero.scroll')}
        />
      </div>
    </section>
  )
}
