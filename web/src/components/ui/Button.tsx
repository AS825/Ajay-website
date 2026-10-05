import type { ReactNode } from 'react'
import { SmartLink } from './SmartLink'

type Variant = 'primary' | 'glass' | 'outline'

const base =
  'pressable inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-[0.95rem] font-semibold tracking-tight select-none disabled:opacity-50'
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-[0_8px_30px_-8px_var(--accent)]',
  glass: 'glass text-white',
  outline: 'border border-white/25 text-white hover:border-white/60',
}

export function buttonClass(variant: Variant = 'primary', extra = '') {
  return `${base} ${variants[variant]} ${extra}`
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
