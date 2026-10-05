import { useTranslation } from 'react-i18next'
import { Container, Section } from '../components/ui/Section'
import { PageShell } from './PageShell'

export function AdminPage() {
  const { t } = useTranslation()
  return (
    <PageShell>
      <Section headingLevel="h1" title={t('admin.title')}>
        <Container>
          <p className="text-muted">{t('admin.comingSoon')}</p>
        </Container>
      </Section>
    </PageShell>
  )
}
