import { useId, type ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { UseFormRegisterReturn } from 'react-hook-form'

export const controlClass =
  'w-full min-h-12 rounded-[16px] border border-hairline bg-white/[0.06] px-4 text-base text-white placeholder:text-white/35 transition-colors focus:border-accent focus:bg-white/[0.09] focus:outline-none aria-[invalid=true]:border-accent'

/** Label + control + translated error. The control gets its id and aria-describedby via render prop. */
export function Field({
  label,
  error,
  optional,
  children,
  className = '',
}: {
  label: string
  error?: string
  optional?: boolean
  children: (id: string, describedBy?: string) => ReactNode
  className?: string
}) {
  const { t } = useTranslation()
  const id = useId()
  const errId = `${id}-err`
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white/80">
        {label}
        {optional && <span className="ml-1 text-white/40">({t('booking.optional')})</span>}
      </label>
      {children(id, error ? errId : undefined)}
      {error && (
        <p id={errId} role="alert" className="mt-1.5 text-sm text-accent">
          {t(error)}
        </p>
      )}
    </div>
  )
}

export function Checkbox({
  registration,
  error,
  children,
}: {
  registration: UseFormRegisterReturn
  error?: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div>
      <label className="flex min-h-12 cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/80">
        <input
          type="checkbox"
          className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
          {...registration}
          aria-invalid={error ? true : undefined}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p role="alert" className="mt-1.5 text-sm text-accent">
          {t(error)}
        </p>
      )}
    </div>
  )
}

/** Required privacy consent with link to the privacy policy (SPEC §14). */
export function PrivacyText({ i18nKey }: { i18nKey: string }) {
  return (
    <Trans
      i18nKey={i18nKey}
      components={{ 1: <Link to="/datenschutz" className="underline underline-offset-2" /> }}
    />
  )
}

/** Honeypot: invisible to people and assistive tech, bots tend to fill it (SPEC §9). */
export function Honeypot({ registration }: { registration: UseFormRegisterReturn }) {
  const { t } = useTranslation()
  return (
    <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        {t('booking.fields.website')}
        <input type="text" tabIndex={-1} autoComplete="off" {...registration} />
      </label>
    </div>
  )
}
