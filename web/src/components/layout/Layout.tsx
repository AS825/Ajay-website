import { Suspense, useEffect, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useSiteData } from '../../lib/data'
import { backgroundCss } from '../../lib/theme'
import { easeOutExpo } from '../../lib/motion'
import { useScrollTo } from '../../lib/smoothScroll'
import { NextEventPill } from '../../features/events/NextEventPill'
import { Header } from './Header'
import { ErrorBoundary } from '../ErrorBoundary'
import { Footer } from './Footer'

/**
 * Scroll handling: after a page change we wait for the exit transition,
 * then jump to the top or the #hash target. Same-page hash links scroll smoothly.
 */
function useRouteScroll() {
  const { pathname, hash } = useLocation()
  const { ready } = useSiteData()
  const scrollTo = useScrollTo()
  const lastPath = useRef(pathname)

  const scrollToTarget = (immediate: boolean) => {
    // Read the live hash: this also runs from onExitComplete after navigation.
    const id = window.location.hash.slice(1)
    const el = id ? document.getElementById(id) : null
    scrollTo(el ?? 'top', immediate || !el)
  }

  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname
      return // handled in onExitComplete
    }
    if (hash) scrollToTarget(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, hash, ready])

  // The incoming page mounts right after the exit completes; wait two frames for it.
  return () => requestAnimationFrame(() => requestAnimationFrame(() => scrollToTarget(true)))
}

function SiteBackground() {
  const { theme } = useSiteData()
  const bg = theme.background
  const media = (bg.type === 'image' || bg.type === 'video') && bg.mediaUrl
  return (
    // A dark overlay is always enforced on media backgrounds for contrast (SPEC §15).
    <div
      className="fixed inset-0 -z-10"
      style={{ background: backgroundCss(bg) }}
      aria-hidden="true"
    >
      {media && bg.type === 'image' && (
        <img src={bg.mediaUrl} alt="" className="size-full object-cover" />
      )}
      {media && bg.type === 'video' && (
        <video
          src={bg.mediaUrl}
          className="size-full object-cover"
          autoPlay
          muted
          loop
          playsInline
        />
      )}
      {media && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: Math.max(0.4, bg.overlayOpacity) }}
        />
      )}
    </div>
  )
}

export function Layout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const reduced = useReducedMotion()
  const onPageChanged = useRouteScroll()

  return (
    <>
      <SiteBackground />
      <a
        href="#main"
        className="glass fixed top-2 left-2 z-[60] -translate-y-20 rounded-full px-4 py-3 text-sm focus:translate-y-[var(--safe-top)]"
      >
        {t('nav.skipToContent')}
      </a>
      <Header />
      <AnimatePresence mode="wait" initial={false} onExitComplete={onPageChanged}>
        <m.div
          key={pathname}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOutExpo } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
        >
          <main id="main">
            <ErrorBoundary key={pathname}>
              <Suspense fallback={<div className="min-h-[100svh]" aria-busy="true" />}>
                {outlet}
              </Suspense>
            </ErrorBoundary>
          </main>
          <Footer />
        </m.div>
      </AnimatePresence>
      <NextEventPill />
    </>
  )
}
