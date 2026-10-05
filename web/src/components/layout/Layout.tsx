import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSiteData } from '../../lib/data'
import { backgroundCss } from '../../lib/theme'
import { Header } from './Header'
import { Footer } from './Footer'

/** Scrolls to #hash targets (also after async data) or to top on navigation. */
function useScrollRestoration() {
  const { pathname, hash } = useLocation()
  const { ready } = useSiteData()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth' })
    else window.scrollTo(0, 0)
  }, [pathname, hash, ready])
}

export function Layout() {
  const { t } = useTranslation()
  const { theme } = useSiteData()
  useScrollRestoration()
  const bg = theme.background
  const media = (bg.type === 'image' || bg.type === 'video') && bg.mediaUrl

  return (
    <>
      {/* Site background from the theme. A dark overlay is always enforced on media for contrast. */}
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
      <a
        href="#main"
        className="glass fixed top-2 left-2 z-[60] -translate-y-20 rounded-full px-4 py-3 text-sm focus:translate-y-[var(--safe-top)]"
      >
        {t('nav.skipToContent')}
      </a>
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
