import { useTranslation } from 'react-i18next'
import { Reveal } from '../../components/motion/Reveal'
import { youtubeId, youtubePlaylistId } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
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

/**
 * Sets & video (SPEC §4.6): latest uploads (synced automatically from the
 * YouTube channels), curated sets from the admin, links to channels/Twitch.
 * All embeds are click-to-load; thumbnails come from our own Storage.
 */
export function Sets() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { linksBy, videos: latest } = useSiteData()
  const videos = linksBy('sets')
  const channels = linksBy('social').filter((l) => l.icon === 'youtube' || l.icon === 'twitch')
  const thumbs = new Map(latest.map((v) => [v.id, v.thumbUrl]))
  const curatedIds = new Set(videos.map((v) => youtubeId(v.url)).filter(Boolean))
  const uploads = latest.filter((v) => !curatedIds.has(v.id)).slice(0, 8)
  const fmt = new Intl.DateTimeFormat(lang === 'de' ? 'de-AT' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  return (
    <Section id="sets" eyebrow={t('sets.eyebrow')} title={t('sets.title')}>
      {uploads.length > 0 && (
        <div className="mb-10">
          <h3 className="eyebrow px-safe mx-auto mb-4 max-w-6xl">{t('sets.latest')}</h3>
          <ul
            className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2"
            style={{
              paddingInline: 'max(1rem, var(--safe-left), calc((100vw - 72rem) / 2 + 1rem))',
              scrollPaddingInline: 'max(1rem, var(--safe-left), calc((100vw - 72rem) / 2 + 1rem))',
            }}
          >
            {uploads.map((v) => (
              <li key={v.id} className="w-[82%] shrink-0 snap-start sm:w-[420px]">
                <ConsentEmbed
                  src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`}
                  title={v.title}
                  note={t('sets.consent')}
                  playLabel={t('sets.play')}
                  cover={
                    <img
                      src={v.thumbUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  }
                />
                <p className="mt-2 line-clamp-2 text-sm font-semibold tracking-tight">{v.title}</p>
                <p className="text-xs text-muted">
                  {v.channelTitle} · {fmt.format(new Date(v.publishedAt))}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
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
                      v.coverUrl || thumbs.get(youtubeId(v.url) ?? '') ? (
                        <img
                          src={v.coverUrl || thumbs.get(youtubeId(v.url) ?? '')}
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
