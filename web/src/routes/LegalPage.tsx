import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import DOMPurify from 'dompurify'
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

/** Legal pages; rich text from the admin, sanitized before rendering. */
export function LegalPage({ page }: { page: keyof typeof TITLES }) {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  const raw = localize(site.legal[page], lang)
  const html = useMemo(
    () =>
      /<[a-z][\s\S]*>/i.test(raw)
        ? DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } })
        : null,
    [raw],
  )
  return (
    <PageShell>
      <Section headingLevel="h1" title={t(TITLES[page])}>
        <Container className="max-w-3xl">
          {html ? (
            <div className="rich-text text-white/80" dangerouslySetInnerHTML={{ __html: html }} />
          ) : (
            <div className="leading-relaxed whitespace-pre-line text-white/80">{raw}</div>
          )}
        </Container>
      </Section>
    </PageShell>
  )
}
