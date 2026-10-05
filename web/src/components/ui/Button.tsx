import type { ReactNode } from 'react'
import { SmartLink } from './SmartLink'

type Variant = 'primary' | 'glass' | 'outline'

type Size = 'md' | 'sm' | 'compact' | 'icon'

const base =
  'pressable inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-tight select-none disabled:opacity-50'
// Padding lives only here so callers never fight over conflicting px-* classes.
const sizes: Record<Size, string> = {
  md: 'min-h-12 px-6 text-[0.95rem]',
  sm: 'min-h-10 px-4 text-sm',
  compact: 'min-h-12 px-3 text-[0.95rem]',
  icon: 'size-12 shrink-0',
}
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-[0_8px_30px_-8px_var(--accent)]',
  glass: 'glass text-white',
  outline: 'border border-white/25 text-white hover:border-white/60',
}

export function buttonClass(variant: Variant = 'primary', extra = '', size: Size = 'md') {
  return `${base} ${sizes[size]} ${variants[variant]} ${extra}`
}

export function ButtonLink({
  href,
  variant,
  className,
  children,
}: {
  href: string
  variant?: Variant
  className?: string
  children: ReactNode
}) {
  return (
    <SmartLink href={href} className={buttonClass(variant, className)}>
      {children}
    </SmartLink>
  )
}
