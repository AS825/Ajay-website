import { useTranslation } from 'react-i18next'
import { ClipReveal } from '../../components/motion/Reveal'
import { BulletList } from '../../components/ui/BulletList'
import { Container, Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'
import { BRAND } from '../../lib/brand'
import { useImageWithFallback } from '../../lib/hooks'

/** "Venues played" (press kit): club photo plus Austria / international lists. */
export function Venues() {
  const { t } = useTranslation()
  const { site } = useSiteData()
  const photo = useImageWithFallback(site.venuesPhoto, BRAND.venues)
  const { austria, international } = site.venues
  if (austria.length + international.length === 0) return null

  return (
    <Section id="venues" title={t('venues.title')}>
      <Container className="grid items-start gap-10 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <ClipReveal className="hidden aspect-[3/5] overflow-hidden md:block">
          <img {...photo} alt="" loading="lazy" className="size-full object-cover" />
        </ClipReveal>
        <div className="grid gap-10 sm:grid-cols-2">
          {austria.length > 0 && (
            <BulletList title={t('venues.austria')} items={[...austria, t('venues.more')]} />
          )}
          {international.length > 0 && (
            <BulletList
              title={t('venues.international')}
              items={[...international, t('venues.more')]}
            />
          )}
        </div>
      </Container>
    </Section>
  )
}
