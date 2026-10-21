import { useTranslation } from 'react-i18next'
import { localize } from '@ajay/shared'
import { ClipReveal, Reveal } from '../../components/motion/Reveal'
import { Container, Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { BRAND } from '../../lib/brand'

/** Technical rider (press kit): gear, photo of the setup and the note for promoters. */
export function Rider() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  const { gear, note } = site.rider
  if (gear.length === 0) return null
  const noteText = localize(note, lang).trim()

  return (
    <Section id="rider" title={t('rider.title')} align="center">
      <Container className="flex flex-col items-center text-center">
        <ul className="space-y-1 text-xl uppercase md:text-2xl">
          {gear.map((g, i) => (
            <li key={`${g}-${i}`}>
              <Reveal delay={i * 0.08}>{g}</Reveal>
            </li>
          ))}
        </ul>
        <ClipReveal className="mt-8 w-full max-w-3xl">
          <img
            src={site.riderPhoto || BRAND.rider}
            alt={gear.join(', ')}
            loading="lazy"
            className="w-full"
          />
        </ClipReveal>
        {noteText && (
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl text-lg uppercase md:text-xl">{noteText}</p>
          </Reveal>
        )}
      </Container>
    </Section>
  )
}
