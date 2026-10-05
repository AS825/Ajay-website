import { useTranslation } from 'react-i18next'
import { ClipReveal, Reveal } from '../../components/motion/Reveal'
import { localize } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { Container, Section } from '../../components/ui/Section'
import { MediaPlaceholder } from '../../components/ui/MediaPlaceholder'

/** Short bio, genres and photos (SPEC §4.8). */
export function About() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  const photos = site.aboutPhotos

  return (
    <Section id="about" eyebrow={t('about.eyebrow')} title={t('about.title')}>
      <Container className="grid gap-10 md:grid-cols-2">
        <div>
          <Reveal>
            <p className="text-xl leading-relaxed text-white/85 md:text-2xl">
              {localize(site.bioShort, lang)}
            </p>
          </Reveal>
          <h3 className="eyebrow mt-10 mb-4">{t('about.genres')}</h3>
          <ul className="flex flex-wrap gap-2">
            {site.genres.map((g) => (
              <li
                key={g}
                className="rounded-full border border-hairline px-4 py-2 text-sm font-semibold"
              >
                {g}
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {photos.length > 0
            ? photos.slice(0, 4).map((src, i) => (
                <ClipReveal
                  key={src}
                  delay={i * 0.08}
                  className={`overflow-hidden rounded-[var(--radius-card)] ${i === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}
                >
                  <img
                    src={src}
                    alt={`${site.artistName} ${i + 1}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                </ClipReveal>
              ))
            : [0, 1, 2].map((i) => (
                <ClipReveal
                  key={i}
                  delay={i * 0.08}
                  className={`overflow-hidden rounded-[var(--radius-card)] ${i === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}
                >
                  <MediaPlaceholder
                    label={i === 0 ? t('about.photosTodo') : undefined}
                    className="size-full"
                  />
                </ClipReveal>
              ))}
        </div>
      </Container>
    </Section>
  )
}
