import { useTranslation } from 'react-i18next'
import { Reveal } from '../../components/motion/Reveal'
import { youtubeId, youtubePlaylistId } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { Container, Section } from '../../components/ui/Section'
import { MediaPlaceholder } from '../../components/ui/MediaPlaceholder'
import { ConsentEmbed } from './ConsentEmbed'
import { LinkRow } from './LinkRow'

function embedUrl(url: string): string | null {
  const id = youtubeId(url)
  const list = youtubePlaylistId(url)
  const base = 'https://www.youtube-nocookie.com/embed/'
  if (id) return `${base}${id}?autoplay=1&rel=0${list ? `&list=${list}` : ''}`
  if (list) return `${base}videoseries?list=${list}&autoplay=1&rel=0`
  return null
}

/** YouTube sets as click-to-load embeds + links to channels/Twitch (SPEC §4.6). */
export function Sets() {
  const { t } = useTranslation()
  const { linksBy } = useSiteData()
  const videos = linksBy('sets')
  const channels = linksBy('social').filter((l) => l.icon === 'youtube' || l.icon === 'twitch')

  return (
    <Section id="sets" eyebrow={t('sets.eyebrow')} title={t('sets.title')}>
      <Container>
        <ul className="grid gap-4 md:grid-cols-2">
          {videos.map((v, i) => {
            const src = embedUrl(v.url)
            if (!src) return null
            return (
              <li key={v.id} className={i === 0 ? 'md:col-span-2' : ''}>
                <Reveal delay={(i % 2) * 0.08}>
                  <ConsentEmbed
                    src={src}
                    title={v.title}
                    note={t('sets.consent')}
                    playLabel={t('sets.play')}
                    cover={
                      v.coverUrl ? (
                        <img
                          src={v.coverUrl}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover"
                        />
                      ) : (
                        <MediaPlaceholder className="size-full" />
                      )
                    }
                  />
                </Reveal>
              </li>
            )
          })}
        </ul>
        <ul className="mt-8 md:max-w-xl">
          {channels.map((l) => (
            <li key={l.id}>
              <LinkRow link={l} />
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
