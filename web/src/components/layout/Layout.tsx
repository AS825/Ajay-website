import { Suspense, useEffect, useRef } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useSiteData } from '../../lib/data'
import { easeOutExpo } from '../../lib/motion'
import { useScrollTo } from '../../lib/smoothScroll'
import { NextEventPill } from '../../features/events/NextEventPill'
import { Header } from './Header'
import { ErrorBoundary } from '../ErrorBoundary'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'

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

/** Public pages use the press-kit colours; the admin keeps its dark UI. */
function useSiteColours() {
  useEffect(() => {
    const root = document.documentElement
    root.dataset.site = ''
    return () => {
      delete root.dataset.site
    }
  }, [])
}

export function Layout() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const outlet = useOutlet()
  const reduced = useReducedMotion()
  const onPageChanged = useRouteScroll()
  useSiteColours()

  return (
    <>
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
      <MobileNav />
    </>
  )
}
