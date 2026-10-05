import { useTranslation } from 'react-i18next'
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
          <p className="text-xl leading-relaxed text-white/85 md:text-2xl">
            {localize(site.bioShort, lang)}
          </p>
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
            ? photos
                .slice(0, 4)
                .map((src, i) => (
                  <img
                    key={src}
                    src={src}
                    alt={`${site.artistName} ${i + 1}`}
                    loading="lazy"
                    className={`w-full rounded-[var(--radius-card)] object-cover ${i === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}
                  />
                ))
            : [0, 1, 2].map((i) => (
                <MediaPlaceholder
                  key={i}
                  label={i === 0 ? t('about.photosTodo') : undefined}
                  className={`rounded-[var(--radius-card)] ${i === 0 ? 'col-span-2 aspect-[4/3]' : 'aspect-square'}`}
                />
              ))}
        </div>
      </Container>
    </Section>
  )
}
