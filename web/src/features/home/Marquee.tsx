import { useSiteData } from '../../lib/data'

/** Endless ticker (SPEC §3). Speed/scroll-coupling polish in Phase 2. */
export function Marquee() {
  const { theme } = useSiteData()
  const text = theme.marqueeText.trim()
  if (!text) return null
  // Repeat enough copies to fill wide screens; the track moves by exactly half.
  const half = Array.from({ length: 4 }, () => text)
  return (
    <div
      className="overflow-hidden border-y border-hairline bg-accent py-4 text-white"
      aria-label={text}
    >
      <div
        className="flex w-max animate-[marquee_28s_linear_infinite] motion-reduce:animate-none"
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
      </div>
    </div>
  )
}
