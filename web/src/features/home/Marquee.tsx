import { useRef } from 'react'
import {
  m,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from 'motion/react'
import { useSiteData } from '../../lib/data'

const BASE_SPEED = 2.2 // % of the track per second
const wrap = (min: number, max: number, v: number) => {
  const r = max - min
  return ((((v - min) % r) + r) % r) + min
}

/**
 * Endless ticker (SPEC §3). Scrolling speeds it up, reverses its direction
 * with the scroll direction and skews it slightly – the "aufbrausend" bit.
 */
export function Marquee() {
  const { theme } = useSiteData()
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref)

  const baseX = useMotionValue(0)
  const { scrollY } = useScroll()
  const velocity = useSpring(useVelocity(scrollY), { damping: 50, stiffness: 400 })
  const boost = useTransform(velocity, [-1500, 0, 1500], [-5, 0, 5], { clamp: false })
  const skew = useTransform(velocity, [-2500, 2500], [7, -7])
  const x = useTransform(baseX, (v) => `${wrap(-50, 0, v)}%`)
  const direction = useRef(-1)

  useAnimationFrame((_, delta) => {
    if (reduced || !inView) return
    const b = boost.get()
    if (b < 0) direction.current = 1
    else if (b > 0) direction.current = -1
    const step = direction.current * BASE_SPEED * (delta / 1000) * (1 + Math.abs(b))
    baseX.set(baseX.get() + step)
  })

  const text = theme.marqueeText.trim()
  if (!text) return null
  const half = Array.from({ length: 4 }, () => text)

  return (
    <div
      ref={ref}
      className="overflow-hidden border-y border-hairline bg-accent py-4 text-white"
      aria-label={text}
      role="marquee"
    >
      <m.div
        className="flex w-max will-change-transform"
        style={reduced ? undefined : { x, skewX: skew }}
        aria-hidden="true"
      >
        {[...half, ...half].map((chunk, i) => (
          <span
            key={i}
            className="shrink-0 pr-8 text-2xl font-extrabold tracking-[-0.03em] whitespace-nowrap uppercase md:text-4xl"
          >
            {chunk}
          </span>
        ))}
      </m.div>
    </div>
  )
}
