import { useTranslation } from 'react-i18next'
import { BulletList } from '../../components/ui/BulletList'
import { Container, Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'

/** "Produced by Ajay" (press kit): remixes and productions in two columns. */
export function Produced() {
  const { t } = useTranslation()
  const { site } = useSiteData()
  const { remixes, tracks } = site.productions
  if (remixes.length + tracks.length === 0) return null

  return (
    <Section id="produced" title={t('produced.title')}>
      <Container className="grid items-start gap-x-10 gap-y-8 md:grid-cols-2">
        {remixes.length > 0 && (
          <BulletList items={[...remixes, t('produced.more')]} className="text-sm md:text-base" />
        )}
        {tracks.length > 0 && <BulletList items={tracks} className="text-sm md:text-base" />}
      </Container>
    </Section>
  )
}
