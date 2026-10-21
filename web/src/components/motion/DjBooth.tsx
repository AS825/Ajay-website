import type { CSSProperties, PointerEvent } from 'react'
import { m, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'

/** Pseudo-random but stable values (same render on every visit). */
const rand = (i: number) => {
  const x = Math.sin(i * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const WAVE = Array.from({ length: 64 }, (_, i) => 0.2 + rand(i) * 0.8)
const PAD_COLORS = [
  '#ff3b5c',
  '#ff8a00',
  '#ffd400',
  '#2bd96b',
  '#00c2ff',
  '#6c5bff',
  '#ff4fd8',
  '#ffffff',
]

/** Scrolling waveform on a player screen (two copies so the loop is seamless). */
function Waveform({ hue }: { hue: string }) {
  return (
    <div className="relative h-full overflow-hidden">
      <div className="booth-wave flex h-full w-[200%] items-center">
        {[...WAVE, ...WAVE].map((h, i) => (
          <span
            key={i}
            className="mx-[0.5px] flex-1 rounded-full"
            style={{
              height: `${h * 100}%`,
              background: `linear-gradient(to bottom, ${hue}, #ffffff 50%, ${hue})`,
              opacity: 0.55 + h * 0.45,
            }}
          />
        ))}
      </div>
      {/* Playhead */}
      <span className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-white shadow-[0_0_8px_#fff]" />
    </div>
  )
}

function Player({ side }: { side: 'left' | 'right' }) {
  const hue = side === 'left' ? '#2f8bff' : '#ff7a1a'
  return (
    <div className="relative flex w-[39%] flex-col rounded-[2.2cqw] bg-gradient-to-b from-[#2a2a2e] via-[#18181b] to-[#0c0c0e] p-[1.4cqw] shadow-[0_2cqw_4cqw_-1cqw_rgb(0_0_0/0.55),inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 ring-black/60">
      {/* Screen */}
      <div className="rounded-[0.8cqw] bg-[#05070b] p-[0.8cqw] ring-1 ring-white/10">
        <div className="mb-[0.5cqw] flex items-center justify-between font-mono text-[1.2cqw] leading-none text-white/70">
          <span>{side === 'left' ? 'DECK 1' : 'DECK 2'}</span>
          <span className="text-[#7CFFB2]">124.00</span>
        </div>
        <div className="h-[6cqw]">
          <Waveform hue={hue} />
        </div>
        <div className="mt-[0.5cqw] h-[0.5cqw] overflow-hidden rounded-full bg-white/10">
          <div className="booth-progress h-full rounded-full" style={{ background: hue }} />
        </div>
      </div>

      {/* Jog wheel */}
      <div className="relative mx-auto mt-[1.8cqw] aspect-square w-[82%]">
        <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,#3a3a40,#121214,#3a3a40,#121214,#3a3a40)] shadow-[0_1cqw_2cqw_rgb(0_0_0/0.6)]" />
        <div className="booth-spin absolute inset-[5%] rounded-full bg-[repeating-conic-gradient(#111_0_2deg,#1c1c20_2deg_4deg)] ring-1 ring-white/10">
          <span className="absolute top-[3%] left-1/2 h-[9%] w-[2.5%] -translate-x-1/2 rounded-full bg-white/80" />
        </div>
        {/* Centre display */}
        <div className="absolute inset-[30%] grid place-items-center rounded-full bg-[#06080c] ring-[0.4cqw] ring-[var(--accent)] shadow-[0_0_3cqw_-0.5cqw_var(--accent)]">
          <div className="booth-spin absolute inset-[8%] rounded-full">
            <span className="absolute top-0 left-1/2 size-[14%] -translate-x-1/2 rounded-full bg-[var(--accent)]" />
          </div>
          <span className="font-mono text-[1.3cqw] font-bold text-white/80">
            {side === 'left' ? 'A' : 'B'}
          </span>
        </div>
      </div>

      {/* Transport + pitch */}
      <div className="mt-auto flex items-end justify-between pt-[1.4cqw]">
        <div className="flex gap-[1cqw]">
          <span className="booth-cue size-[3.4cqw] rounded-full ring-[0.3cqw] ring-[#ff9a1f]" />
          <span className="booth-play size-[3.4cqw] rounded-full ring-[0.3cqw] ring-[#2bd96b]" />
        </div>
        <div className="relative h-[8cqw] w-[1.2cqw] rounded-full bg-black/70 ring-1 ring-white/10">
          <span className="booth-pitch absolute left-1/2 h-[1.4cqw] w-[2.6cqw] -translate-x-1/2 rounded-[0.3cqw] bg-gradient-to-b from-[#d9d9de] to-[#7a7a80]" />
        </div>
      </div>
    </div>
  )
}

function Knob({ i }: { i: number }) {
  return (
    <span
      className="booth-knob relative aspect-square w-full rounded-full bg-[radial-gradient(circle_at_35%_30%,#55555c,#1a1a1d_70%)] shadow-[0_0.3cqw_0.6cqw_rgb(0_0_0/0.6)] ring-1 ring-black/70"
      style={
        {
          '--knob-from': `${-60 + rand(i) * 60}deg`,
          '--knob-to': `${rand(i + 9) * 90}deg`,
          animationDelay: `${-rand(i + 4) * 4}s`,
        } as CSSProperties
      }
    >
      <span className="absolute top-[8%] left-1/2 h-[38%] w-[10%] -translate-x-1/2 rounded-full bg-white/85" />
    </span>
  )
}

function Mixer() {
  return (
    <div className="relative flex w-[20%] flex-col gap-[1.2cqw] rounded-[1.6cqw] bg-gradient-to-b from-[#232326] to-[#0d0d0f] p-[1.2cqw] shadow-[0_2cqw_4cqw_-1cqw_rgb(0_0_0/0.55),inset_0_1px_0_rgb(255_255_255/0.08)] ring-1 ring-black/60">
      <div className="grid grid-cols-3 gap-[1cqw]">
        {Array.from({ length: 9 }, (_, i) => (
          <Knob key={i} i={i} />
        ))}
      </div>
      {/* VU meters */}
      <div className="flex h-[9cqw] justify-center gap-[1.2cqw]">
        {[0, 1].map((ch) => (
          <div key={ch} className="flex w-[1.2cqw] flex-col-reverse gap-[0.25cqw]">
            {Array.from({ length: 10 }, (_, i) => (
              <span
                key={i}
                className="booth-vu flex-1 rounded-[0.15cqw]"
                style={{
                  background: i > 7 ? '#ff3b3b' : i > 5 ? '#ffc21a' : '#2bd96b',
                  animationDelay: `${(ch * 0.11 + i * 0.018).toFixed(3)}s`,
                  ['--vu-level' as string]: String(i / 10),
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {/* Performance pads */}
      <div className="grid grid-cols-4 gap-[0.6cqw]">
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className="booth-pad aspect-square rounded-[0.4cqw]"
            style={
              {
                '--pad': PAD_COLORS[i],
                animationDelay: `calc(var(--beat) * ${i % 4} / 2)`,
              } as CSSProperties
            }
          />
        ))}
      </div>
      {/* Channel faders */}
      <div className="mt-auto flex justify-around">
        {[0, 1].map((ch) => (
          <div
            key={ch}
            className="relative h-[8cqw] w-[0.8cqw] rounded-full bg-black/70 ring-1 ring-white/10"
          >
            <span
              className="booth-fader absolute left-1/2 h-[1.3cqw] w-[2.4cqw] -translate-x-1/2 rounded-[0.3cqw] bg-gradient-to-b from-[#e2e2e6] to-[#77777d]"
              style={{ animationDelay: `${ch * -3}s` }}
            />
          </div>
        ))}
      </div>
      {/* Crossfader */}
      <div className="relative mx-auto h-[0.8cqw] w-[80%] rounded-full bg-black/70 ring-1 ring-white/10">
        <span className="booth-xfade absolute top-1/2 h-[2.2cqw] w-[1.3cqw] -translate-y-1/2 rounded-[0.3cqw] bg-gradient-to-r from-[#e2e2e6] to-[#77777d]" />
      </div>
    </div>
  )
}

/**
 * Animated DJ booth (two players + battle mixer), drawn in CSS so it stays sharp at any
 * size and follows the accent colour. Everything runs on the shared 124 BPM beat;
 * the booth tilts towards the pointer. Static under prefers-reduced-motion.
 */
export function DjBooth({ className = '' }: { className?: string }) {
  const reduced = useReducedMotion()
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-8, 8]), { stiffness: 120, damping: 18 })
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -3]), { stiffness: 120, damping: 18 })

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    px.set((e.clientX - r.left) / r.width - 0.5)
    py.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <div
      className={`@container [perspective:1400px] ${className}`}
      onPointerMove={onMove}
      onPointerLeave={() => {
        px.set(0)
        py.set(0)
      }}
      role="img"
      aria-label="DJ setup: 2 players and a mixer"
    >
      <m.div
        className="relative flex items-stretch justify-center gap-[1.2cqw] rounded-[3cqw] bg-[#0a0a0b] p-[2cqw] shadow-[0_4cqw_8cqw_-3cqw_rgb(0_0_0/0.7)]"
        style={reduced ? undefined : { rotateX, rotateY, transformStyle: 'preserve-3d' }}
      >
        {/* Booth glow that thumps on the beat */}
        <div className="beat-pulse pointer-events-none absolute -inset-[4%] -z-10 rounded-[4cqw] bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_45%,transparent),transparent)] blur-2xl" />
        <Player side="left" />
        <Mixer />
        <Player side="right" />
      </m.div>
    </div>
  )
}
