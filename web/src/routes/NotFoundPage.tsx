import { useTranslation } from 'react-i18next'
import { ButtonLink } from '../components/ui/Button'
import { Container } from '../components/ui/Section'
import { PageShell } from './PageShell'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <PageShell>
      <Container className="flex min-h-[70svh] flex-col justify-center py-20">
        <p className="eyebrow mb-4">404</p>
        <h1 className="display-lg mb-4">{t('notFound.title')}</h1>
        <p className="mb-8 text-muted">{t('notFound.text')}</p>
        <ButtonLink href="/" className="self-start">
          {t('notFound.back')}
        </ButtonLink>
      </Container>
    </PageShell>
  )
}
