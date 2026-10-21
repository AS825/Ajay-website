import { useTranslation } from 'react-i18next'
import { m, useReducedMotion } from 'motion/react'
import { BulletList } from '../../components/ui/BulletList'
import { Container, Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'
import { BRAND } from '../../lib/brand'
import { useImageWithFallback } from '../../lib/hooks'
import { easeOutExpo } from '../../lib/motion'

/** "Produced by Ajay" (press kit): remixes and productions, Ajay with the guitar. */
export function Produced() {
  const { t } = useTranslation()
  const { site } = useSiteData()
  const reduced = useReducedMotion()
  const photo = useImageWithFallback(site.producedPhoto, BRAND.produced)
  const { remixes, tracks } = site.productions
  if (remixes.length + tracks.length === 0) return null

  return (
    <Section id="produced" title={t('produced.title')}>
      <Container className="grid items-start gap-x-10 gap-y-8 md:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
        {remixes.length > 0 && (
          <BulletList items={[...remixes, t('produced.more')]} className="text-sm md:text-base" />
        )}
        {tracks.length > 0 && <BulletList items={tracks} className="text-sm md:text-base" />}
        <m.img
          {...photo}
          alt=""
          loading="lazy"
          className="mx-auto w-[min(70vw,320px)] md:col-span-2 lg:col-span-1 lg:w-[280px] lg:self-end"
          initial={reduced ? false : { opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 1.2, ease: easeOutExpo }}
        />
      </Container>
    </Section>
  )
}
