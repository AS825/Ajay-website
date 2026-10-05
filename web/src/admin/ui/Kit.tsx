import { useId, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Localized } from '@ajay/shared'
import { controlClass } from '../../components/form/Field'
import { SegmentedControl } from '../../components/ui/SegmentedControl'

export { controlClass }

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

export function Card({
  title,
  children,
  className = '',
  actions,
}: {
  title?: string
  children: ReactNode
  className?: string
  actions?: ReactNode
}) {
  return (
    <section
      className={`rounded-[var(--radius-card)] border border-hairline bg-white/[0.03] p-4 md:p-6 ${className}`}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-lg font-bold tracking-tight">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  )
}

export function Label({
  htmlFor,
  children,
  hint,
}: {
  htmlFor?: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-sm font-medium text-white/80">
      {children}
      {hint && <span className="ml-1 font-normal text-white/40">{hint}</span>}
    </label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  placeholder,
  multiline,
  rows = 4,
  className = '',
  inputMode,
  required,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  hint?: string
  placeholder?: string
  multiline?: boolean
  rows?: number
  className?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode']
  required?: boolean
}) {
  const id = useId()
  return (
    <div className={className}>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      {multiline ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${controlClass} py-3`}
          required={required}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          required={required}
          onChange={(e) => onChange(e.target.value)}
          className={`${controlClass} ${type === 'datetime-local' || type === 'date' ? '[color-scheme:dark]' : ''}`}
        />
      )}
    </div>
  )
}

/** EN/DE text with a language switch (EN required, DE optional – SPEC §18). */
export function LocalizedField({
  label,
  value,
  onChange,
  multiline,
  rows,
  className = '',
}: {
  label: string
  value: Localized | undefined
  onChange: (v: Localized) => void
  multiline?: boolean
  rows?: number
  className?: string
}) {
  const { t } = useTranslation()
  const [lang, setLang] = useState<'en' | 'de'>('en')
  const v = value ?? { en: '' }
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <SegmentedControl
          label={t('admin.common.language')}
          value={lang}
          onChange={setLang}
          options={[
            { value: 'en', label: 'EN' },
            { value: 'de', label: v.de?.trim() ? 'DE' : 'DE ·' },
          ]}
        />
      </div>
      <TextField
        label={lang === 'en' ? t('admin.common.english') : t('admin.common.germanOptional')}
        value={lang === 'en' ? v.en : (v.de ?? '')}
        onChange={(text) => onChange(lang === 'en' ? { ...v, en: text } : { ...v, de: text })}
        multiline={multiline}
        rows={rows}
        placeholder={lang === 'de' ? v.en : undefined}
      />
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  description?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="pressable flex min-h-12 w-full items-center justify-between gap-4 text-left"
    >
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <span
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-white/15'}`}
        aria-hidden="true"
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform duration-300 ease-[var(--ease-spring)] ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </span>
    </button>
  )
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
}) {
  const id = useId()
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={controlClass}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[18px] border border-dashed border-white/15 p-6 text-center text-sm text-muted">
      {children}
    </p>
  )
}

export function Spinner() {
  return (
    <span
      className="inline-block size-5 animate-spin rounded-full border-2 border-white/30 border-t-white"
      aria-hidden="true"
    />
  )
}
