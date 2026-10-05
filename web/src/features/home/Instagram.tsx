import { useTranslation } from 'react-i18next'
import { ArrowUpRight, Images, Play } from 'lucide-react'
import { useSiteData } from '../../lib/data'
import { Container, Section } from '../../components/ui/Section'
import { ClipReveal } from '../../components/motion/Reveal'
import { SocialIcon } from '../../components/ui/SocialIcon'
import { buttonClass } from '../../components/ui/Button'

/**
 * Latest Instagram posts (synced via the Instagram API, images served from our
 * Storage). Each tile opens the post on Instagram. Without synced posts the
 * section is a big "follow" call to action.
 */
export function Instagram() {
  const { t } = useTranslation()
  const { posts, linksBy } = useSiteData()
  const profile = linksBy('social').find((l) => l.icon === 'instagram')
  if (!profile && posts.length === 0) return null
  const handle = profile?.url.match(/instagram\.com\/([\w.]+)/)?.[1]

  const follow = profile && (
    <a
      href={profile.url}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonClass('outline', 'shrink-0', 'sm')}
    >
      <SocialIcon icon="instagram" className="size-4" /> {handle ? `@${handle}` : 'Instagram'}
    </a>
  )

  return (
    <Section
      id="instagram"
      eyebrow={t('instagram.eyebrow')}
      title={t('instagram.title')}
      action={posts.length ? follow : undefined}
    >
      <Container>
        {posts.length === 0 ? (
          <a
            href={profile!.url}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable group flex items-center justify-between gap-4 rounded-[var(--radius-card)] border border-hairline bg-white/[0.03] p-6 hover:border-white/25 md:p-8"
          >
            <span className="flex items-center gap-4">
              <span className="grid size-14 place-items-center rounded-full bg-accent">
                <SocialIcon icon="instagram" className="size-7" />
              </span>
              <span>
                <span className="block text-2xl font-extrabold tracking-tight">
                  {handle ? `@${handle}` : 'Instagram'}
                </span>
                <span className="block text-sm text-muted">{t('instagram.follow')}</span>
              </span>
            </span>
            <ArrowUpRight
              className="size-6 shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        ) : (
          <ul className="grid grid-cols-3 gap-1.5 md:gap-3">
            {posts.slice(0, 9).map((p, i) => (
              <li key={p.id}>
                <ClipReveal
                  delay={(i % 3) * 0.06}
                  className="overflow-hidden rounded-[10px] md:rounded-[18px]"
                >
                  <a
                    href={p.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block aspect-square bg-surface-2"
                    aria-label={
                      p.caption
                        ? `${t('instagram.post')}: ${p.caption.slice(0, 80)}`
                        : t('instagram.post')
                    }
                  >
                    <img
                      src={p.imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {p.mediaType !== 'IMAGE' && (
                      <span
                        className="absolute top-2 right-2 text-white drop-shadow"
                        aria-hidden="true"
                      >
                        {p.mediaType === 'VIDEO' ? (
                          <Play className="size-4 fill-white" />
                        ) : (
                          <Images className="size-4" />
                        )}
                      </span>
                    )}
                  </a>
                </ClipReveal>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </Section>
  )
}
