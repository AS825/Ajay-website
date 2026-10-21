import { useTranslation } from 'react-i18next'
import { ClipReveal, Reveal } from '../../components/motion/Reveal'
import { localize } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { BRAND } from '../../lib/brand'
import { useImageWithFallback } from '../../lib/hooks'
import { Container, Section } from '../../components/ui/Section'

/** "A little about me" (press kit): bio on the left, portrait on the right. */
export function About() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  const [first, ...more] = site.aboutPhotos
  const main = useImageWithFallback(first, BRAND.about)

  return (
    <Section id="about" eyebrow={t('about.eyebrow')} title={t('about.title')}>
      <Container className="grid items-start gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <Reveal>
            <p className="text-lg leading-relaxed whitespace-pre-line md:text-xl">
              {localize(site.bioShort, lang)}
            </p>
          </Reveal>
        </div>
        <div className="space-y-3">
          <ClipReveal className="overflow-hidden">
            <img {...main} alt={site.artistName} loading="lazy" className="w-full object-cover" />
          </ClipReveal>
          {more.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {more.slice(0, 3).map((src, i) => (
                <ClipReveal key={src} delay={i * 0.08} className="aspect-square overflow-hidden">
                  <img
                    src={src}
                    alt={`${site.artistName} ${i + 2}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </ClipReveal>
              ))}
            </div>
          )}
        </div>
      </Container>
    </Section>
  )
}
