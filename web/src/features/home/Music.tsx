import { useTranslation } from 'react-i18next'
import { Reveal } from '../../components/motion/Reveal'
import { isTodo } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { Container, Section } from '../../components/ui/Section'
import { LinkRow } from './LinkRow'
import { ConsentEmbed } from './ConsentEmbed'
import { MediaPlaceholder } from '../../components/ui/MediaPlaceholder'

function spotifyEmbedUrl(url: string): string | null {
  const m = url.match(/open\.spotify\.com\/(?:intl-\w+\/)?artist\/(\w+)/)
  return m ? `https://open.spotify.com/embed/artist/${m[1]}?theme=0` : null
}

/** Streaming + audio platforms (SPEC §4.5). */
export function Music() {
  const { t } = useTranslation()
  const { site, linksBy } = useSiteData()
  const embed = isTodo(site.spotifyArtistUrl) ? null : spotifyEmbedUrl(site.spotifyArtistUrl)
  const audio = linksBy('social').filter(
    (l) => l.icon === 'soundcloud' || l.icon === 'mixcloud' || l.icon === 'bandcamp',
  )

  return (
    <Section id="music" eyebrow={t('music.eyebrow')} title={t('music.title')}>
      <Container className="grid gap-10 md:grid-cols-2 md:gap-14">
        <Reveal>
          {embed ? (
            <ConsentEmbed
              src={embed}
              title="Spotify – AJAY ADAM"
              note={t('music.consent')}
              playLabel={t('sets.play')}
              aspect="aspect-[4/5] md:aspect-square"
            />
          ) : (
            <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-card)] border border-hairline">
              <MediaPlaceholder className="absolute inset-0" label="TODO Spotify" />
              <p className="absolute inset-x-0 bottom-0 p-5 pb-12 text-sm text-white/80">
                {t('music.spotifyTodo')}
              </p>
            </div>
          )}
        </Reveal>
        <div>
          <ul>
            {[...linksBy('streaming'), ...audio].map((l, i) => (
              <li key={l.id}>
                <Reveal delay={Math.min(i, 6) * 0.04}>
                  <LinkRow link={l} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  )
}
