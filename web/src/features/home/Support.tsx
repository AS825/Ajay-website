import { useTranslation } from 'react-i18next'
import { Heart } from 'lucide-react'
import { useSiteData } from '../../lib/data'
import { Container } from '../../components/ui/Section'
import { buttonClass } from '../../components/ui/Button'

/** Subtle PayPal.me support button (SPEC §4.10). */
export function Support() {
  const { t } = useTranslation()
  const { site } = useSiteData()
  if (!site.supportUrl) return null
  return (
    <section aria-label={t('support.button')} className="py-12">
      <Container className="flex flex-col items-center gap-4 text-center">
        <p className="text-muted">{t('support.text')}</p>
        <a
          href={site.supportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClass('outline')}
        >
          <Heart className="size-4 text-accent" aria-hidden="true" /> {t('support.button')}
        </a>
      </Container>
    </section>
  )
}
