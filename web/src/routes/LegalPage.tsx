import { useTranslation } from 'react-i18next'
import { localize } from '@ajay/shared'
import { useSiteData } from '../lib/data'
import { useLang } from '../i18n'
import { Container, Section } from '../components/ui/Section'
import { PageShell } from './PageShell'

const TITLES = {
  impressum: 'legal.imprint',
  datenschutz: 'legal.privacy',
  agb: 'legal.terms',
} as const

/** Legal pages; texts are plain text for now, rich text comes with the admin (Phase 5). */
export function LegalPage({ page }: { page: keyof typeof TITLES }) {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  return (
    <PageShell>
      <Section title={t(TITLES[page])}>
        <Container className="max-w-3xl">
          <div className="leading-relaxed whitespace-pre-line text-white/80">
            {localize(site.legal[page], lang)}
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}
