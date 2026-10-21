import { useRef } from 'react'
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { localize } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { easeOutExpo } from '../../lib/motion'
import { BRAND } from '../../lib/brand'
import { useImageWithFallback } from '../../lib/hooks'
import { AnimatedLogo } from '../../components/motion/AnimatedLogo'

/**
 * Press-kit cover: the logo in the middle with two short lines below it and the
 * portrait cut-out on the right edge. Quiet entrance, gentle parallax on scroll.
 */
export function Hero() {
  const { lang } = useLang()
  const { theme, site } = useSiteData()
  const reduced = !!useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const logo = useImageWithFallback(theme.logoUrl, BRAND.logo)
  const photo = useImageWithFallback(theme.hero.imageUrl, BRAND.hero)
  const line1 = localize(theme.hero.subline, lang).trim()
  const line2 = localize(theme.hero.quote, lang).trim()

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const photoY = useTransform(scrollYProgress, [0, 1], ['0%', '8%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '-12%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  const fade = (delay: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 1.2, ease: easeOutExpo, delay },
        }

  return (
    <section
      ref={ref}
      aria-label={site.artistName}
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden md:justify-center"
    >
      <m.img
        {...photo}
        alt=""
        className="absolute top-0 right-0 -z-10 h-[60svh] w-auto max-w-none object-contain object-top md:top-auto md:right-[-10vw] md:bottom-0 md:h-[80%] md:object-bottom lg:right-[-6vw]"
        style={reduced ? undefined : { y: photoY }}
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: easeOutExpo }}
      />
      {/* Keeps the text readable where the portrait reaches behind it on phones. */}
      <div
        className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-black via-black/90 to-transparent md:hidden"
        aria-hidden="true"
      />

      <m.div
        className="px-safe mx-auto flex w-full max-w-6xl flex-col items-center pb-16 text-center md:pb-0"
        style={{
          paddingTop: 'calc(var(--header-h) + var(--safe-top))',
          ...(reduced ? {} : { y: contentY, opacity: contentOpacity }),
        }}
      >
        <h1 className="w-[min(80vw,440px)]">
          <AnimatedLogo src={logo.src} onError={logo.onError} alt={site.artistName} />
        </h1>
        {line1 && (
          <m.p className="mt-2 text-2xl uppercase md:text-3xl" {...fade(0.7)}>
            {line1}
          </m.p>
        )}
        {line2 && (
          <m.p className="text-base uppercase md:text-lg" {...fade(0.85)}>
            {line2}
          </m.p>
        )}
      </m.div>
    </section>
  )
}
