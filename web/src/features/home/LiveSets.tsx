import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from 'lucide-react'
import { ClipReveal, Reveal } from '../../components/motion/Reveal'
import { Container, Section } from '../../components/ui/Section'
import { QrCode } from '../../components/ui/QrCode'
import { useSiteData } from '../../lib/data'

/** "Live DJ sets" (press kit): QR code to the YouTube playlist, plus a plain link for phones. */
export function LiveSets() {
  const { t } = useTranslation()
  const { site } = useSiteData()
  const url = site.liveSetsUrl.trim()
  if (!/^https?:\/\//.test(url)) return null

  return (
    <Section id="livesets" title={t('livesets.title')}>
      <Container>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex flex-col items-start gap-4"
        >
          <ClipReveal className="w-64 md:w-80">
            <QrCode text={url} label={t('livesets.qr')} className="rounded-none p-4" />
          </ClipReveal>
          <Reveal>
            <span className="inline-flex items-center gap-1 text-lg uppercase underline-offset-4 group-hover:underline">
              {t('livesets.watch')} <ArrowUpRight className="size-5" aria-hidden="true" />
            </span>
          </Reveal>
        </a>
      </Container>
    </Section>
  )
}
