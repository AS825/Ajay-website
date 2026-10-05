import { useId, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trans, useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  BUDGET_RANGES,
  EVENT_TYPES,
  SET_LENGTHS,
  bookingSchema,
  type Booking,
  type BookingInput,
} from '@ajay/shared'
import { buttonClass } from '../../components/ui/Button'

const control =
  'w-full min-h-12 rounded-[16px] border border-hairline bg-white/[0.06] px-4 text-base text-white placeholder:text-white/35 transition-colors focus:border-accent focus:bg-white/[0.09] focus:outline-none aria-[invalid=true]:border-accent'

function Field({
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

/** Booking request form (SPEC §9). Submission via `submitBooking` follows in Phase 4. */
export function BookingForm() {
  const { t } = useTranslation()
  const [notice, setNotice] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput, unknown, Booking>({
    resolver: zodResolver(bookingSchema),
    mode: 'onTouched',
    defaultValues: { website: '' },
  })

  const onSubmit = async (_data: Booking) => {
    // TODO(Phase 4): call the `submitBooking` Cloud Function.
    setNotice(true)
  }

  const err = (k: keyof BookingInput) => errors[k]?.message
  const a11y = (k: keyof BookingInput, describedBy?: string) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': describedBy,
  })

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="relative grid gap-5 sm:grid-cols-2"
    >
      <Field label={t('booking.fields.name')} error={err('name')}>
        {(id, d) => (
          <input
            id={id}
            className={control}
            autoComplete="name"
            {...register('name')}
            {...a11y('name', d)}
          />
        )}
      </Field>
      <Field label={t('booking.fields.company')} error={err('company')} optional>
        {(id, d) => (
          <input
            id={id}
            className={control}
            autoComplete="organization"
            {...register('company')}
            {...a11y('company', d)}
          />
        )}
      </Field>
      <Field label={t('booking.fields.email')} error={err('email')}>
        {(id, d) => (
          <input
            id={id}
            type="email"
            inputMode="email"
            autoComplete="email"
            className={control}
            {...register('email')}
            {...a11y('email', d)}
          />
        )}
      </Field>
      <Field label={t('booking.fields.phone')} error={err('phone')}>
        {(id, d) => (
          <input
            id={id}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={control}
            {...register('phone')}
            {...a11y('phone', d)}
          />
        )}
      </Field>
      <Field label={t('booking.fields.eventType')} error={err('eventType')}>
        {(id, d) => (
          <select
            id={id}
            className={control}
            defaultValue=""
            {...register('eventType')}
            {...a11y('eventType', d)}
          >
            <option value="" disabled>
              {t('booking.select')}
            </option>
            {EVENT_TYPES.map((v) => (
              <option key={v} value={v}>
                {t(`booking.eventTypes.${v}`)}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label={t('booking.fields.date')} error={err('date')}>
        {(id, d) => (
          <input
            id={id}
            type="date"
            className={`${control} [color-scheme:dark]`}
            {...register('date')}
            {...a11y('date', d)}
          />
        )}
      </Field>
      <Field label={t('booking.fields.location')} error={err('location')}>
        {(id, d) => (
          <input
            id={id}
            className={control}
            autoComplete="address-level2"
            {...register('location')}
            {...a11y('location', d)}
          />
        )}
      </Field>
      <Field label={t('booking.fields.setLength')} error={err('setLength')}>
        {(id, d) => (
          <select
            id={id}
            className={control}
            defaultValue=""
            {...register('setLength')}
            {...a11y('setLength', d)}
          >
            <option value="" disabled>
              {t('booking.select')}
            </option>
            {SET_LENGTHS.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field label={t('booking.fields.expectedGuests')} error={err('expectedGuests')}>
        {(id, d) => (
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={1}
            className={control}
            {...register('expectedGuests')}
            {...a11y('expectedGuests', d)}
          />
        )}
      </Field>
      <Field label={t('booking.fields.budget')} error={err('budget')}>
        {(id, d) => (
          <select
            id={id}
            className={control}
            defaultValue=""
            {...register('budget')}
            {...a11y('budget', d)}
          >
            <option value="" disabled>
              {t('booking.select')}
            </option>
            {BUDGET_RANGES.map((v) => (
              <option key={v} value={v}>
                {t(`booking.budgets.${v}`)}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field
        label={t('booking.fields.message')}
        error={err('message')}
        optional
        className="sm:col-span-2"
      >
        {(id, d) => (
          <textarea
            id={id}
            rows={5}
            className={`${control} py-3`}
            {...register('message')}
            {...a11y('message', d)}
          />
        )}
      </Field>

      {/* Honeypot: hidden from humans and assistive tech, bots fill it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          {t('booking.fields.website')}
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
        </label>
      </div>

      <div className="sm:col-span-2">
        <label className="flex min-h-12 cursor-pointer items-start gap-3 text-sm leading-relaxed text-white/80">
          <input
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-[var(--accent)]"
            {...register('privacyAccepted')}
            aria-invalid={errors.privacyAccepted ? true : undefined}
          />
          <span>
            <Trans
              i18nKey="booking.fields.privacy"
              components={{
                1: <Link to="/datenschutz" className="underline underline-offset-2" />,
              }}
            />
          </span>
        </label>
        {errors.privacyAccepted?.message && (
          <p role="alert" className="mt-1.5 text-sm text-accent">
            {t(errors.privacyAccepted.message)}
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={buttonClass('primary', 'w-full sm:w-auto')}
        >
          {t('booking.submit')}
        </button>
        {notice && (
          <p
            role="status"
            className="mt-4 rounded-[16px] border border-hairline bg-white/[0.06] p-4 text-sm text-white/80"
          >
            {t('booking.notYet')}
          </p>
        )}
      </div>
    </form>
  )
}
