import { useTranslation } from 'react-i18next'
import { ClipReveal, Reveal } from '../../components/motion/Reveal'
import { localize } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { BRAND } from '../../lib/brand'
import { Container, Section } from '../../components/ui/Section'

/** "A little about me" (press kit): bio on the left, portrait on the right, genres below. */
export function About() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  const [main = BRAND.about, ...more] = site.aboutPhotos

  return (
    <Section id="about" eyebrow={t('about.eyebrow')} title={t('about.title')}>
      <Container className="grid items-start gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div>
          <Reveal>
            <p className="text-lg leading-relaxed whitespace-pre-line text-white/85 md:text-xl">
              {localize(site.bioShort, lang)}
            </p>
          </Reveal>
          {site.genres.length > 0 && (
            <>
              <h3 className="eyebrow mt-10 mb-4">{t('about.genres')}</h3>
              <ul className="flex flex-wrap gap-2">
                {site.genres.map((g, i) => (
                  <li key={g}>
                    <Reveal
                      delay={i * 0.05}
                      className="rounded-full border border-white/30 px-4 py-2 text-sm font-semibold uppercase transition-colors hover:border-accent hover:bg-accent hover:text-[var(--on-accent,#fff)]"
                    >
                      {g}
                    </Reveal>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        <div className="space-y-3">
          <ClipReveal className="overflow-hidden">
            <img
              src={main}
              alt={site.artistName}
              loading="lazy"
              className="w-full object-cover transition-transform duration-[1.2s] hover:scale-[1.03]"
            />
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
