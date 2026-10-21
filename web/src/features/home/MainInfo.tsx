import { useTranslation } from 'react-i18next'
import { localize } from '@ajay/shared'
import { ClipReveal, Reveal } from '../../components/motion/Reveal'
import { Container, Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { BRAND } from '../../lib/brand'
import { useImageWithFallback } from '../../lib/hooks'

/** "Main info" (press kit): photo and the key facts. */
export function MainInfo() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  const photo = useImageWithFallback(site.infoPhoto, BRAND.info)
  if (site.facts.length === 0) return null

  return (
    <Section id="info" title={t('info.title')}>
      <Container className="grid items-start gap-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
        <ClipReveal className="aspect-square overflow-hidden">
          <img {...photo} alt={site.artistName} loading="lazy" className="size-full object-cover" />
        </ClipReveal>
        <ul className="space-y-2 text-xl italic md:text-2xl">
          {site.facts.map((fact, i) => (
            <li key={i}>
              <Reveal delay={i * 0.06} className="flex gap-3">
                <span
                  className="mt-[0.55em] size-2 shrink-0 rounded-full bg-white"
                  aria-hidden="true"
                />
                <span>{localize(fact, lang)}</span>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
