import { useTranslation } from 'react-i18next'
import { ClipReveal, Reveal } from '../../components/motion/Reveal'
import { BulletList } from '../../components/ui/BulletList'
import { Container, Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'
import { BRAND } from '../../lib/brand'
import { useImageWithFallback } from '../../lib/hooks'

/** "Artist support" (press kit): photo plus the artists in two columns. */
export function Artists() {
  const { t } = useTranslation()
  const { site } = useSiteData()
  const photo = useImageWithFallback(site.artistsPhoto, BRAND.artists)
  const { artists } = site
  if (artists.length === 0) return null
  const half = Math.ceil(artists.length / 2)

  return (
    <Section id="artists" title={t('artists.title')}>
      <Container className="grid items-start gap-10 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <ClipReveal className="hidden aspect-[3/4] overflow-hidden md:block">
          <img {...photo} alt="" loading="lazy" className="size-full object-cover" />
        </ClipReveal>
        <div>
          <div className="grid gap-x-10 gap-y-0.5 sm:grid-cols-2">
            <BulletList items={artists.slice(0, half)} />
            <BulletList items={artists.slice(half)} />
          </div>
          <Reveal>
            <p className="mt-6 text-sm font-bold tracking-[0.12em] uppercase">
              {t('artists.more')}
            </p>
          </Reveal>
        </div>
      </Container>
    </Section>
  )
}
