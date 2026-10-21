import { useTranslation } from 'react-i18next'
import { localize } from '@ajay/shared'
import { Reveal } from '../../components/motion/Reveal'
import { DjBooth } from '../../components/motion/DjBooth'
import { Container, Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'

/** Technical rider (press kit): gear list, an animated booth and the note for promoters. */
export function Rider() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  const { gear, note } = site.rider
  if (gear.length === 0) return null
  const noteText = localize(note, lang).trim()

  return (
    <Section id="rider" title={t('rider.title')}>
      <Container>
        <ul className="mb-10 space-y-1 text-xl uppercase md:mb-14 md:text-3xl">
          {gear.map((g, i) => (
            <li key={`${g}-${i}`}>
              <Reveal delay={i * 0.08}>{g}</Reveal>
            </li>
          ))}
        </ul>
        <Reveal>
          <DjBooth className="mx-auto max-w-5xl" />
        </Reveal>
        {noteText && (
          <Reveal delay={0.1}>
            <p className="mx-auto mt-10 max-w-2xl text-center text-lg uppercase md:mt-14 md:text-xl">
              {noteText}
            </p>
          </Reveal>
        )}
      </Container>
    </Section>
  )
}
