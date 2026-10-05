import { useState, type ReactNode } from 'react'
import { Play } from 'lucide-react'

/**
 * Two-click embed (SPEC §14): nothing is loaded from the third party until
 * the user taps. Good for privacy and for performance.
 */
export function ConsentEmbed({
  src,
  title,
  note,
  playLabel,
  aspect = 'aspect-video',
  cover,
}: {
  src: string
  title: string
  note: string
  playLabel: string
  aspect?: string
  cover?: ReactNode
}) {
  const [active, setActive] = useState(false)
  return (
    <div
      className={`relative overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface ${aspect}`}
    >
      {active ? (
        <iframe
          src={src}
          title={title}
          className="absolute inset-0 size-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 flex size-full flex-col items-center justify-center gap-4 p-5 text-center"
        >
          {cover && <span className="absolute inset-0">{cover}</span>}
          <span className="absolute inset-0 bg-black/40" />
          <span className="pressable relative grid size-16 place-items-center rounded-full bg-accent shadow-[0_8px_30px_-6px_var(--accent)] group-active:scale-95">
            <Play className="ml-1 size-7 fill-white" aria-hidden="true" />
          </span>
          <span className="relative">
            <span className="block text-base font-semibold tracking-tight">{title}</span>
            <span className="sr-only">{playLabel}</span>
            <span className="mx-auto mt-1 block max-w-sm text-[11px] leading-snug text-white/60">
              {note}
            </span>
          </span>
        </button>
      )}
    </div>
  )
}
