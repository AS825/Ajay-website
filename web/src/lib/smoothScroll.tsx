import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { useReducedMotion } from 'motion/react'

const LenisContext = createContext<Lenis | null>(null)

/**
 * Lenis smooth scrolling for wheel/trackpad. Touch keeps native scrolling
 * (iOS momentum), and it's fully disabled for prefers-reduced-motion.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (reduced) return
    const instance = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false })
    let raf = requestAnimationFrame(function loop(time) {
      instance.raf(time)
      raf = requestAnimationFrame(loop)
    })
    // Lenis must be created in the effect; exposing it via state is intended.
    setLenis(instance)
    return () => {
      cancelAnimationFrame(raf)
      instance.destroy()
      setLenis(null)
    }
  }, [reduced])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}

export function useLenis() {
  return useContext(LenisContext)
}

/** Headroom so anchored sections aren't hidden behind the fixed header. */
const HEADER_OFFSET = -72

export function useScrollTo() {
  const lenis = useLenis()
  return (target: HTMLElement | 'top', immediate = false) => {
    if (lenis) {
      // Lenis caches the scroll limit; after a page change it may still be the old page's height.
      lenis.resize()
      lenis.scrollTo(target === 'top' ? 0 : target, {
        offset: target === 'top' ? 0 : HEADER_OFFSET,
        immediate,
      })
    } else if (target === 'top') {
      window.scrollTo(0, 0)
    } else {
      target.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' })
    }
  }
}

/** Locks page scroll (menu, bottom sheet) – works with and without Lenis. */
export function useScrollLock(locked: boolean) {
  const lenis = useLenis()
  useEffect(() => {
    if (!locked) return
    lenis?.stop()
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      lenis?.start()
      document.body.style.overflow = prev
    }
  }, [locked, lenis])
}
