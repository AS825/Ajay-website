import type { ReactNode } from 'react'

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'accent' | 'neutral' | 'muted'
  children: ReactNode
}) {
  const tones = {
    accent: 'bg-accent text-white',
    neutral: 'glass text-white',
    muted: 'bg-white/10 text-white/60',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${tones[tone]}`}
    >
      {tone === 'accent' && (
        <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
      )}
      {children}
    </span>
  )
}
