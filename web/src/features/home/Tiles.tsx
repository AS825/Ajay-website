import { useTranslation } from 'react-i18next'
import { ClipReveal } from '../../components/motion/Reveal'
import { ArrowUpRight } from 'lucide-react'
import { localize } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { Container, Section } from '../../components/ui/Section'
import { SmartLink, isExternal } from '../../components/ui/SmartLink'
import { MediaPlaceholder } from '../../components/ui/MediaPlaceholder'

/** Carl-Cox-style navigation with big image tiles (SPEC §4.4). */
export function Tiles() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()

  return (
    <Section id="explore" eyebrow={t('tiles.eyebrow')} title={t('tiles.title')}>
      <Container>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {site.tiles.map((tile, i) => (
            <li key={tile.id}>
              <ClipReveal
                delay={(i % 3) * 0.08}
                className="overflow-hidden rounded-[var(--radius-card)]"
              >
                <SmartLink
                  href={tile.href}
                  className="pressable group relative block aspect-[16/11] overflow-hidden rounded-[var(--radius-card)] border border-hairline"
                >
                  {tile.imageUrl ? (
                    <img
                      src={tile.imageUrl}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <MediaPlaceholder className="absolute inset-0" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                    <div>
                      <p className="text-4xl leading-none font-extrabold tracking-[-0.045em]">
                        {tile.title}
                      </p>
                      <p className="mt-2 text-xs font-semibold tracking-[0.18em] text-white/70">
                        / {localize(tile.subtitle, lang)}
                      </p>
                    </div>
                    {isExternal(tile.href) && (
                      <ArrowUpRight
                        className="size-6 shrink-0 text-white/70"
                        aria-label={t('common.external')}
                      />
                    )}
                  </div>
                </SmartLink>
              </ClipReveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
