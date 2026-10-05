import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, m } from 'motion/react'
import { Minus, Plus } from 'lucide-react'
import { z } from 'zod'
import { guestlistSchema, type GuestlistInput, type JoinGuestlistResult } from '@ajay/shared'
import { callErrorReason, callFunction, type CallErrorReason } from '../../lib/callable'
import { easeOutExpo } from '../../lib/motion'
import { useSiteData } from '../../lib/data'
import type { EventView } from '../../lib/events'
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

/** Guestlist sign-up (SPEC §7), shown in a bottom sheet on the event page. */
export function GuestlistForm({
  event,
  waitlist,
  onDone,
}: {
  event: EventView
  waitlist: boolean
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { reload } = useSiteData()
  const [error, setError] = useState<CallErrorReason | null>(null)
  const [result, setResult] = useState<(JoinGuestlistResult & { email: string }) | null>(null)
  const maxPlusOnes = event.guestlist.maxPlusOnes

  // Same schema as the function, with this event's plus-one limit; eventId/lang are added on submit.
  const schema = useMemo(
    () =>
      guestlistSchema
        .omit({ eventId: true, lang: true })
        .extend({ plusOnes: z.number().int().min(0).max(maxPlusOnes) }),
    [maxPlusOnes],
  )
  type FormIn = z.input<typeof schema>
  type FormOut = z.output<typeof schema>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { plusOnes: 0, newsletter: false, website: '', phone: '' },
  })
  const plusOnes = watch('plusOnes') ?? 0

  const onSubmit = async (data: FormOut) => {
    setError(null)
    try {
      const res = await callFunction<GuestlistInput, JoinGuestlistResult>('joinGuestlist', {
        ...data,
        eventId: event.id,
        lang,
      })
      setResult({ ...res, email: data.email })
      reload()
    } catch (err) {
      setError(callErrorReason(err))
    }
  }

  const a11y = (k: keyof FormIn, describedBy?: string) => ({
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': describedBy,
  })

  return (
    <AnimatePresence mode="wait" initial={false}>
      {result ? (
        <m.div
          key="done"
          role="status"
          className="flex flex-col items-center gap-5 py-4 text-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: easeOutExpo }}
        >
          <SuccessCheck tone={result.status === 'confirmed' ? 'accent' : 'muted'} />
          <div>
            <h3 className="mb-2 text-2xl font-extrabold tracking-tight">
              {result.status === 'confirmed'
                ? t('guestlist.confirmedTitle')
                : t('guestlist.waitlistDoneTitle')}
            </h3>
            <p className="text-white/80">
              {result.status === 'confirmed'
                ? t('guestlist.confirmedText', { email: result.email })
                : t('guestlist.waitlistDoneText', { email: result.email })}
            </p>
          </div>
          <button type="button" onClick={onDone} className={buttonClass('glass', 'w-full')}>
            {t('guestlist.done')}
          </button>
        </m.div>
      ) : (
        <m.form
          key="form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="relative grid gap-4"
          exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
        >
          <p className="-mt-2 text-sm text-muted">{event.title}</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('guestlist.firstName')} error={errors.firstName?.message}>
              {(id, d) => (
                <input
                  id={id}
                  className={control}
                  autoComplete="given-name"
                  {...register('firstName')}
                  {...a11y('firstName', d)}
                />
              )}
            </Field>
            <Field label={t('guestlist.lastName')} error={errors.lastName?.message}>
              {(id, d) => (
                <input
                  id={id}
                  className={control}
                  autoComplete="family-name"
                  {...register('lastName')}
                  {...a11y('lastName', d)}
                />
              )}
            </Field>
          </div>
          <Field label={t('guestlist.email')} error={errors.email?.message}>
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
          <Field label={t('guestlist.phone')} error={errors.phone?.message} optional>
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

          {maxPlusOnes > 0 && (
            <div className="flex items-center justify-between gap-4 rounded-[16px] border border-hairline bg-white/[0.04] px-4 py-2">
              <div>
                <p id="plus-ones-label" className="text-sm font-medium text-white/80">
                  {t('guestlist.plusOnes')}
                </p>
                <p className="text-xs text-white/45">
                  {t('guestlist.plusOnesHint', { max: maxPlusOnes })}
                </p>
              </div>
              <div
                className="flex items-center gap-1"
                role="group"
                aria-labelledby="plus-ones-label"
              >
                <button
                  type="button"
                  onClick={() => setValue('plusOnes', Math.max(0, plusOnes - 1))}
                  disabled={plusOnes <= 0}
                  className={buttonClass('glass', 'disabled:opacity-30', 'icon')}
                  aria-label={t('guestlist.decrease')}
                >
                  <Minus className="size-5" aria-hidden="true" />
                </button>
                <output
                  className="w-10 text-center text-2xl font-bold tabular-nums"
                  aria-live="polite"
                >
                  {plusOnes}
                </output>
                <button
                  type="button"
                  onClick={() => setValue('plusOnes', Math.min(maxPlusOnes, plusOnes + 1))}
                  disabled={plusOnes >= maxPlusOnes}
                  className={buttonClass('glass', 'disabled:opacity-30', 'icon')}
                  aria-label={t('guestlist.increase')}
                >
                  <Plus className="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          <Honeypot registration={register('website')} />

          <Checkbox
            registration={register('privacyAccepted')}
            error={errors.privacyAccepted?.message}
          >
            <PrivacyText i18nKey="guestlist.privacy" />
          </Checkbox>
          {/* Newsletter is separate and never pre-checked (SPEC §14). */}
          <Checkbox registration={register('newsletter')}>{t('guestlist.newsletter')}</Checkbox>

          <FormError reason={error} />
          <SubmitButton loading={isSubmitting} className="w-full">
            {waitlist ? t('guestlist.submitWaitlist') : t('guestlist.submit')}
          </SubmitButton>
        </m.form>
      )}
    </AnimatePresence>
  )
}
