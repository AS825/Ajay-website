import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { useSiteData } from '../../lib/data'
import { Container, Section } from '../../components/ui/Section'

// Form libs (react-hook-form, zod) load only when the section is rendered.
const BookingForm = lazy(() => import('./BookingForm').then((m) => ({ default: m.BookingForm })))

export function BookingSection({
  id = 'booking',
  headingLevel,
}: {
  id?: string
  headingLevel?: 'h1' | 'h2'
}) {
  const { t } = useTranslation()
  const { site } = useSiteData()
  return (
    <Section
      id={id}
      headingLevel={headingLevel}
      eyebrow={t('booking.eyebrow')}
      title={t('booking.title')}
    >
      <Container className="max-w-3xl">
        <p className="mb-2 text-lg text-white/80">{t('booking.intro')}</p>
        <p className="mb-10 text-sm text-muted">
          {t('booking.orMail')}{' '}
          <a
            href={`mailto:${site.bookingEmail}`}
            className="text-white underline underline-offset-2"
          >
            {site.bookingEmail}
          </a>
        </p>
        <Suspense fallback={<div className="min-h-[60rem] sm:min-h-[36rem]" aria-busy="true" />}>
          <BookingForm />
        </Suspense>
      </Container>
    </Section>
  )
}
