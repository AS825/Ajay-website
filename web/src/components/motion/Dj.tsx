import type { CSSProperties } from 'react'

/** Tempo all DJ-style loops share, so pulse, equalizer and vinyl feel on the same beat. */
export const BPM = 124
const BEAT_S = 60 / BPM

/** Pseudo-random but stable bar pattern (no hydration/render jitter). */
const rand = (i: number) => {
  const x = Math.sin(i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/**
 * Animated spectrum / equalizer bars in the accent colour. Pure CSS (one keyframe,
 * per-bar duration and delay), so it costs nothing on the main thread and stops
 * automatically under prefers-reduced-motion.
 */
export function Equalizer({
  bars = 48,
  className = '',
  mirror = false,
}: {
  bars?: number
  className?: string
  /** Bars grow from the centre line in both directions (spectrum look). */
  mirror?: boolean
}) {
  return (
    <div
      className={`flex items-end gap-[3px] ${mirror ? 'items-center' : ''} ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: bars }, (_, i) => {
        // Bass on the left is taller and slower, highs on the right are shorter and faster.
        const pos = i / Math.max(1, bars - 1)
        const peak = 0.35 + (1 - pos) * 0.45 + rand(i) * 0.2
        const style = {
          '--eq-peak': peak.toFixed(2),
          animationDuration: `${(BEAT_S * (0.5 + rand(i + 7) * 0.75)).toFixed(3)}s`,
          animationDelay: `${(-rand(i + 3) * BEAT_S * 2).toFixed(3)}s`,
        } as CSSProperties
        return (
          <span
            key={i}
            className="eq-bar h-full flex-1 rounded-full bg-accent"
            style={{ ...style, transformOrigin: mirror ? 'center' : 'bottom' }}
          />
        )
      })}
    </div>
  )
}

/** Small 4-bar "now playing" indicator (header logo, live badges). */
export function NowPlaying({ className = '' }: { className?: string }) {
  return <Equalizer bars={4} className={`h-3.5 w-4 gap-[2px] ${className}`} />
}

/** Spinning vinyl record with grooves and an accent label; tilts its sheen like studio light. */
export function Vinyl({ className = '', label }: { className?: string; label?: string }) {
  return (
    <div className={`vinyl relative aspect-square rounded-full ${className}`} aria-hidden="true">
      <div className="vinyl-disc absolute inset-0 rounded-full">
        <div className="absolute inset-[32%] grid place-items-center rounded-full bg-accent">
          {label && (
            <span className="text-[min(2.2vw,0.8rem)] font-extrabold tracking-[0.2em] text-black/80 uppercase">
              {label}
            </span>
          )}
          <span className="absolute size-[10%] rounded-full bg-black" />
        </div>
      </div>
      <div className="vinyl-sheen pointer-events-none absolute inset-0 rounded-full" />
    </div>
  )
}

/** Club light: a soft accent spotlight that sweeps left and right over a section. */
export function LightSweep({ className = '' }: { className?: string }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="light-beam" />
      <div className="light-beam light-beam--b" />
    </div>
  )
}
