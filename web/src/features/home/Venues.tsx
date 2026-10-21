import { useTranslation } from 'react-i18next'
import { ClipReveal, Reveal } from '../../components/motion/Reveal'
import { Container, Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'
import { BRAND } from '../../lib/brand'
import { useImageWithFallback } from '../../lib/hooks'

function VenueList({ title, venues }: { title: string; venues: string[] }) {
  const { t } = useTranslation()
  return (
    <div>
      <h3 className="mb-3 text-sm font-bold tracking-[0.12em] uppercase">{title}:</h3>
      <ul className="space-y-0.5 text-lg uppercase md:text-xl">
        {[...venues, t('venues.more')].map((v, i) => (
          <li key={`${v}-${i}`}>
            <Reveal delay={Math.min(i, 12) * 0.03} className="flex items-center gap-3">
              <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
              <span>{v}</span>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  )
}

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
          {austria.length > 0 && <VenueList title={t('venues.austria')} venues={austria} />}
          {international.length > 0 && (
            <VenueList title={t('venues.international')} venues={international} />
          )}
        </div>
      </Container>
    </Section>
  )
}
