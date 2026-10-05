import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, m } from 'motion/react'
import {
  BUDGET_RANGES,
  EVENT_TYPES,
  SET_LENGTHS,
  bookingSchema,
  type Booking,
  type BookingInput,
  type Lang,
} from '@ajay/shared'
import { callErrorReason, callFunction, type CallErrorReason } from '../../lib/callable'
import { easeOutExpo } from '../../lib/motion'
import { useLang } from '../../i18n'
import {
  Checkbox,
  Field,
  Honeypot,
  PrivacyText,
  controlClass as control,
} from '../../components/form/Field'
import { FormError, SubmitButton, SuccessCheck } from '../../components/form/FormStatus'
import { buttonClass } from '../../components/ui/Button'

/** Booking request form (SPEC §9), submitted via the `submitBooking` Cloud Function. */
export function BookingForm() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const [error, setError] = useState<CallErrorReason | null>(null)
  const [sent, setSent] = useState<{ name: string; email: string } | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingInput, unknown, Booking>({
    resolver: zodResolver(bookingSchema),
    mode: 'onTouched',
    defaultValues: { website: '' },
  })

  const onSubmit = async (data: Booking) => {
    setError(null)
    try {
      await callFunction<Booking & { lang: Lang }, { ok: true }>('submitBooking', { ...data, lang })
      setSent({ name: data.name, email: data.email })
      reset()
    } catch (err) {
      setError(callErrorReason(err))
    }
  }

  const err = (k: keyof BookingInput) => errors[k]?.message
  const a11y = (k: keyof BookingInput, describedBy?: string) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': describedBy,
  })

  return (
    <AnimatePresence mode="wait" initial={false}>
      {sent ? (
        <m.div
          key="sent"
          role="status"
          className="flex flex-col items-start gap-5 rounded-[var(--radius-card)] border border-hairline bg-white/[0.04] p-6 md:p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <SuccessCheck />
          <div>
            <h3 className="mb-2 text-3xl font-extrabold tracking-tight">
              {t('booking.successTitle')}
            </h3>
            <p className="text-white/80">{t('booking.successText', sent)}</p>
          </div>
          <button type="button" onClick={() => setSent(null)} className={buttonClass('outline')}>
            {t('booking.another')}
          </button>
        </m.div>
      ) : (
        <m.form
          key="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="relative grid gap-5 sm:grid-cols-2"
          exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
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

          <Honeypot registration={register('website')} />

          <div className="sm:col-span-2">
            <Checkbox
              registration={register('privacyAccepted')}
              error={errors.privacyAccepted?.message}
            >
              <PrivacyText i18nKey="booking.fields.privacy" />
            </Checkbox>
          </div>

          <div className="space-y-4 sm:col-span-2">
            <FormError reason={error} />
            <SubmitButton loading={isSubmitting} className="w-full sm:w-auto">
              {t('booking.submit')}
            </SubmitButton>
          </div>
        </m.form>
      )}
    </AnimatePresence>
  )
}
