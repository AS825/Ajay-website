import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowDown } from 'lucide-react'
import { localize } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { easeOutExpo } from '../../lib/motion'
import { ButtonLink } from '../../components/ui/Button'
import { RevealText } from '../../components/motion/Reveal'

/** Slowly drifting accent glow (SPEC §3 "langsam wandernder Farbverlauf"). */
function AccentDrift({ animate }: { animate: boolean }) {
  const blob = 'absolute rounded-full blur-3xl will-change-transform'
  const loop = {
    duration: 18,
    repeat: Infinity,
    repeatType: 'mirror' as const,
    ease: 'easeInOut' as const,
  }
  return (
    <div className="absolute inset-0 overflow-hidden mix-blend-screen" aria-hidden="true">
      <m.div
        className={`${blob} -top-[10%] right-[-25%] size-[90vmax] opacity-60`}
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in srgb, var(--accent) 80%, transparent), transparent)',
        }}
        animate={
          animate
            ? { x: ['0%', '-22%', '-8%'], y: ['0%', '14%', '28%'], scale: [1, 1.15, 0.95] }
            : undefined
        }
        transition={loop}
      />
      <m.div
        className={`${blob} bottom-[-30%] left-[-30%] size-[70vmax] opacity-40`}
        style={{
          background:
            'radial-gradient(closest-side, color-mix(in srgb, var(--accent) 60%, #ff7a00), transparent)',
        }}
        animate={animate ? { x: ['0%', '30%', '10%'], y: ['0%', '-18%', '-6%'] } : undefined}
        transition={{ ...loop, duration: 23 }}
      />
    </div>
  )
}

/** Full-screen hero (SPEC §4.1): Ken Burns / video, drifting accent, animated grain, parallax. */
export function Hero() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { theme } = useSiteData()
  const reduced = !!useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const h = theme.hero
  const subline = localize(h.subline, lang).trim()
  const headline = h.headline.trim()
  // Strip quotes typed by hand so they never appear twice.
  const quote = localize(h.quote, lang)
    .trim()
    .replace(/^["„“”']+|["„“”']+$/g, '')
    .trim()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const mediaY = useTransform(scrollYProgress, [0, 1], ['0%', '22%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-18%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0])

  const fadeUp = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1, ease: easeOutExpo, delay },
        }

  return (
    <section
      ref={ref}
      aria-label={headline || undefined}
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden"
    >
      <m.div
        className="absolute inset-0 -z-10"
        style={reduced ? undefined : { y: mediaY }}
        aria-hidden="true"
      >
        {h.mediaType === 'video' && h.videoUrl ? (
          <video
            className="size-full object-cover"
            src={h.videoUrl}
            poster={h.posterUrl || undefined}
            autoPlay={!reduced}
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : h.mediaType === 'image' && h.imageUrl ? (
          <m.img
            className="size-full object-cover"
            src={h.imageUrl}
            alt=""
            fetchPriority="high"
            initial={{ scale: 1.15 }}
            animate={reduced ? { scale: 1 } : { scale: [1.15, 1.02], x: ['0%', '-2%'] }}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 22, ease: 'linear', repeat: Infinity, repeatType: 'mirror' }
            }
          />
        ) : (
          // TODO(Ajay): hero photo/video. Until then the accent drift on black carries the hero.
          <div className="size-full bg-black" />
        )}
        <AccentDrift animate={!reduced} />
        <div className="absolute -inset-[50%] grain animate-[grain_1.2s_steps(6)_infinite] motion-reduce:animate-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/5 to-black" />
      </m.div>

      <m.div
        className="px-safe mx-auto w-full max-w-6xl pb-10 md:pb-20"
        style={{
          paddingTop: 'calc(var(--header-h) + var(--safe-top) + 2rem)',
          ...(reduced ? {} : { y: contentY, opacity: contentOpacity }),
        }}
      >
        {/* Each text line only renders when it has content (empty fields in Admin → Design hide it). */}
        {subline && (
          <m.p className="eyebrow mb-4 text-white/80" {...fadeUp(0.1)}>
            {subline}
          </m.p>
        )}
        {headline && (
          <RevealText
            as="h1"
            text={headline}
            className={`display-xl block uppercase ${quote ? 'mb-6' : 'mb-10'}`}
            onMount
            delay={0.2}
          />
        )}
        {quote && (
          <m.blockquote
            className="mb-10 max-w-xl text-2xl leading-tight font-semibold tracking-tight text-white/90 md:text-4xl"
            {...fadeUp(0.55)}
          >
            „{quote}“
          </m.blockquote>
        )}
        <m.div className="flex flex-col gap-3 sm:flex-row" {...fadeUp(0.7)}>
          <ButtonLink href="/#events" variant="primary">
            {t('hero.ctaEvents')}
          </ButtonLink>
          <ButtonLink href="/booking" variant="glass">
            {t('hero.ctaBooking')}
          </ButtonLink>
        </m.div>
        <m.div
          className="mt-10 hidden justify-center md:flex"
          animate={reduced ? undefined : { y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ArrowDown className="size-5 text-white/50" aria-label={t('hero.scroll')} />
        </m.div>
      </m.div>
    </section>
  )
}
