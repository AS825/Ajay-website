import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Logo } from './Logo'
import { Menu } from './Menu'

/** Minimal header: logo left, burger right. Turns into glass after scrolling. */
export function Header() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,border-color,backdrop-filter] duration-300 ${
          scrolled ? 'glass border-x-0 border-t-0' : 'border-b border-transparent'
        }`}
        style={{ paddingTop: 'var(--safe-top)' }}
      >
        <div className="px-safe mx-auto flex h-16 max-w-6xl items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="pressable -mr-2 grid size-12 place-items-center rounded-full"
            aria-label={t('nav.openMenu')}
            aria-expanded={open}
            aria-controls="site-menu"
          >
            <span className="flex w-6 flex-col gap-[6px]" aria-hidden="true">
              <span className="h-[2px] w-full rounded bg-white" />
              <span className="h-[2px] w-2/3 self-end rounded bg-white" />
            </span>
          </button>
        </div>
      </header>
      <Menu open={open} onClose={() => setOpen(false)} />
    </>
  )
}
