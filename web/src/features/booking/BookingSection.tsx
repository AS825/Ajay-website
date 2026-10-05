import { useTranslation } from 'react-i18next'
import { useSiteData } from '../../lib/data'
import { Container, Section } from '../../components/ui/Section'
import { BookingForm } from './BookingForm'

export function BookingSection({ id = 'booking' }: { id?: string }) {
  const { t } = useTranslation()
  const { site } = useSiteData()
  return (
    <Section id={id} eyebrow={t('booking.eyebrow')} title={t('booking.title')}>
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
        <BookingForm />
      </Container>
    </Section>
  )
}
