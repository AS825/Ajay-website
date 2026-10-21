import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { localize } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { easeOutExpo } from '../../lib/motion'
import { BRAND } from '../../lib/brand'
import { ButtonLink } from '../../components/ui/Button'
import { Equalizer, Vinyl } from '../../components/motion/Dj'

/**
 * Press-kit hero: logo in the middle, portrait cut-out on the right edge of the sand
 * page, a record spinning behind the portrait and a spectrum along the bottom.
 */
export function SandHero() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { theme, site } = useSiteData()
  const reduced = !!useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const h = theme.hero
  const logo = theme.logoUrl || BRAND.logo
  const photo = h.mediaType === 'image' && h.imageUrl ? h.imageUrl : BRAND.hero
  const subline = localize(h.subline, lang).trim()
  const quote = localize(h.quote, lang)
    .trim()
    .replace(/^["„“”']+|["„“”']+$/g, '')
    .trim()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '12%'])
  const vinylRotate = useTransform(scrollYProgress, [0, 1], [0, 140])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-25%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

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
      aria-label={site.artistName}
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden md:justify-center"
    >
      {/* Record behind the portrait: drops in, then spins on the beat (and a bit more on scroll). */}
      <m.div
        className="absolute top-[8%] right-[-18vw] -z-20 w-[78vw] max-w-[520px] md:top-1/2 md:right-[14vw] md:w-[min(58vh,480px)] md:-translate-y-1/2"
        style={reduced ? undefined : { rotate: vinylRotate }}
        initial={reduced ? false : { opacity: 0, scale: 0.6, x: 160 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 1.4, ease: easeOutExpo, delay: 0.4 }}
        aria-hidden="true"
      >
        <Vinyl label={site.aka} />
      </m.div>

      <m.img
        src={photo}
        alt=""
        fetchPriority="high"
        className="hero-photo absolute top-0 right-0 -z-10 h-[64svh] w-auto max-w-none object-contain object-top md:top-auto md:bottom-0 md:h-[96%]"
        style={reduced ? undefined : { y: photoY }}
        initial={reduced ? false : { opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease: easeOutExpo }}
      />
      {/* Keeps the text readable where the portrait reaches behind it on phones. */}
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-[55%] bg-gradient-to-t from-black via-black/85 to-transparent md:hidden"
        aria-hidden="true"
      />

      <Equalizer
        bars={72}
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-16 text-white! opacity-[0.12] md:h-24"
      />

      <m.div
        className="px-safe mx-auto flex w-full max-w-6xl flex-col items-center pb-14 text-center md:items-start md:pb-0 md:pl-[8vw] md:text-left lg:pl-[14vw]"
        style={{
          paddingTop: 'calc(var(--header-h) + var(--safe-top) + 1rem)',
          ...(reduced ? {} : { y: contentY, opacity: contentOpacity }),
        }}
      >
        <m.h1
          className="w-[min(78vw,460px)]"
          initial={reduced ? false : { opacity: 0, scale: 0.85, filter: 'blur(12px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, ease: easeOutExpo, delay: 0.15 }}
        >
          <img src={logo} alt={site.artistName} className="beat-bump w-full" />
        </m.h1>
        {subline && (
          <m.p
            className="mt-4 text-2xl tracking-tight uppercase md:w-[min(78vw,460px)] md:text-center md:text-3xl"
            {...fadeUp(0.45)}
          >
            {subline}
          </m.p>
        )}
        {quote && (
          <m.p
            className="mt-1 text-base tracking-wide uppercase opacity-80 md:w-[min(78vw,460px)] md:text-center"
            {...fadeUp(0.55)}
          >
            {quote}
          </m.p>
        )}
        <m.div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row" {...fadeUp(0.7)}>
          <ButtonLink href="/#events" variant="primary">
            {t('hero.ctaEvents')}
          </ButtonLink>
          <ButtonLink href="/booking" variant="outline">
            {t('hero.ctaBooking')}
          </ButtonLink>
        </m.div>
      </m.div>
    </section>
  )
}
