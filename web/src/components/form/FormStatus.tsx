import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { m } from 'motion/react'
import { AlertCircle } from 'lucide-react'
import type { CallErrorReason } from '../../lib/callable'
import { springBouncy } from '../../lib/motion'
import { buttonClass } from '../ui/Button'

export function SubmitButton({
  loading,
  children,
  className = '',
}: {
  loading: boolean
  children: ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <button
      type="submit"
      disabled={loading}
      aria-busy={loading}
      className={buttonClass('primary', className)}
    >
      {loading && (
        <span
          className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          aria-hidden="true"
        />
      )}
      {loading ? t('forms.sending') : children}
    </button>
  )
}

export function FormError({ reason }: { reason: CallErrorReason | null }) {
  const { t } = useTranslation()
  if (!reason) return null
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-[16px] border border-accent/40 bg-accent/10 p-4 text-sm text-white"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
      {t(`forms.errors.${reason}`)}
    </p>
  )
}

/** Animated success check (spring scale + stroke draw), SPEC §7. */
export function SuccessCheck({ tone = 'accent' }: { tone?: 'accent' | 'muted' }) {
  return (
    <m.div
      className={`grid size-20 place-items-center rounded-full ${tone === 'accent' ? 'bg-accent shadow-[0_10px_40px_-8px_var(--accent)]' : 'bg-white/15'}`}
      initial={{ scale: 0, rotate: -30 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={springBouncy}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-10"
        fill="none"
        stroke="white"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <m.path
          d="M5 12.5l4.5 4.5L19 7.5"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.2, duration: 0.45, ease: 'easeOut' }}
        />
      </svg>
    </m.div>
  )
}
