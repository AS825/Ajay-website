import type { PointerEvent } from 'react'
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { easeOutExpo } from '../../lib/motion'

/**
 * The cover logo: sharpens in on load, then floats slowly; a warm sheen runs across
 * the letters every few seconds and the logo tilts a little towards the mouse.
 * Everything stays still under prefers-reduced-motion.
 */
export function AnimatedLogo({
  src,
  alt,
  onError,
  className = '',
}: {
  src: string
  alt: string
  onError?: () => void
  className?: string
}) {
  const reduced = useReducedMotion()
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const spring = { stiffness: 90, damping: 16 }
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-10, 10]), spring)
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [8, -8]), spring)

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <div
      className={`[perspective:900px] ${className}`}
      onPointerMove={onMove}
      onPointerLeave={() => {
        px.set(0)
        py.set(0)
      }}
    >
      <m.div
        className="logo-float relative"
        style={reduced ? undefined : { rotateX, rotateY }}
        initial={reduced ? false : { opacity: 0, scale: 0.92, filter: 'blur(14px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 1.8, ease: easeOutExpo, delay: 0.2 }}
      >
        <img src={src} alt={alt} onError={onError} className="block w-full" />
        {/* Sheen clipped to the logo's own shape. */}
        <span
          className="logo-sheen pointer-events-none absolute inset-0"
          style={{ maskImage: `url("${src}")`, WebkitMaskImage: `url("${src}")` }}
          aria-hidden="true"
        />
      </m.div>
    </div>
  )
}
