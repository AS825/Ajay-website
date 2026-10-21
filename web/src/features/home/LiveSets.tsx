import { useTranslation } from 'react-i18next'
import { youtubePlaylistId } from '@ajay/shared'
import { ClipReveal, Reveal } from '../../components/motion/Reveal'
import { Container, Section } from '../../components/ui/Section'
import { QrCode } from '../../components/ui/QrCode'
import { SocialIcon } from '../../components/ui/SocialIcon'
import { ButtonLink } from '../../components/ui/Button'
import { useSiteData } from '../../lib/data'
import { ConsentEmbed } from './ConsentEmbed'

/** "Live DJ sets" (press kit): the playlist as QR code (scan from a laptop) and click-to-play embed. */
export function LiveSets() {
  const { t } = useTranslation()
  const { site } = useSiteData()
  const url = site.liveSetsUrl.trim()
  if (!/^https?:\/\//.test(url)) return null
  const list = youtubePlaylistId(url)

  return (
    <Section id="livesets" title={t('livesets.title')}>
      <Container className="grid items-center gap-10 md:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <div className="flex flex-col items-start gap-6">
          <ClipReveal className="hidden w-full max-w-xs md:block">
            <QrCode text={url} label={t('livesets.qr')} />
          </ClipReveal>
          <Reveal>
            <p className="text-lg md:hidden">{t('livesets.intro')}</p>
            <p className="hidden text-lg md:block">{t('livesets.scan')}</p>
          </Reveal>
          <Reveal delay={0.1}>
            <ButtonLink href={url} variant="primary">
              <SocialIcon icon="youtube" className="size-5" /> {t('livesets.watch')}
            </ButtonLink>
          </Reveal>
        </div>
        {list && (
          <Reveal>
            <ConsentEmbed
              src={`https://www.youtube-nocookie.com/embed/videoseries?list=${list}&autoplay=1&rel=0`}
              title={t('livesets.title')}
              note={t('sets.consent')}
              playLabel={t('sets.play')}
            />
          </Reveal>
        )}
      </Container>
    </Section>
  )
}
