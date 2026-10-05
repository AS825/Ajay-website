import type { ReactNode } from 'react'
import { m, useReducedMotion } from 'motion/react'
import { easeOutExpo } from '../../lib/motion'

const viewport = { once: true, margin: '0px 0px -12% 0px' }

/**
 * Text reveal: each word rises out of a clipping mask, staggered, so lines
 * appear to slide in from below (SPEC §3). `onMount` animates immediately
 * (hero) instead of on scroll.
 */
export function RevealText({
  text,
  id,
  as: Tag = 'span',
  className,
  delay = 0,
  onMount = false,
}: {
  text: string
  id?: string
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p'
  className?: string
  delay?: number
  onMount?: boolean
}) {
  const reduced = useReducedMotion()
  if (reduced)
    return (
      <Tag id={id} className={className}>
        {text}
      </Tag>
    )
  const words = text.split(/\s+/)
  const trigger = onMount ? { animate: 'shown' } : { whileInView: 'shown', viewport }
  return (
    <Tag id={id} className={className} aria-label={text}>
      <m.span
        initial="hidden"
        {...trigger}
        transition={{ staggerChildren: 0.06, delayChildren: delay }}
        aria-hidden="true"
      >
        {words.map((w, i) => (
          <span
            key={i}
            className="-mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom"
          >
            <m.span
              className="inline-block will-change-transform"
              variants={{ hidden: { y: '110%' }, shown: { y: '0%' } }}
              transition={{ duration: 0.9, ease: easeOutExpo }}
            >
              {w}
            </m.span>
            {i < words.length - 1 && ' '}
          </span>
        ))}
      </m.span>
    </Tag>
  )
}

/** Generic fade-up on scroll. */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: 0.9, ease: easeOutExpo, delay }}
    >
      {children}
    </m.div>
  )
}

/** Image reveal with a clip-path wipe from the bottom plus a slight zoom-out. */
export function ClipReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const reduced = useReducedMotion()
  if (reduced) return <div className={className}>{children}</div>
  return (
    <m.div
      className={className}
      initial={{ clipPath: 'inset(100% 0% 0% 0%)', scale: 1.08 }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)', scale: 1 }}
      viewport={viewport}
      transition={{ duration: 1.1, ease: easeOutExpo, delay }}
    >
      {children}
    </m.div>
  )
}
