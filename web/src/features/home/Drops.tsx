import { useTranslation } from 'react-i18next'
import { Reveal } from '../../components/motion/Reveal'
import { ArrowUpRight } from 'lucide-react'
import { localize } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { Container, Section } from '../../components/ui/Section'
import { MediaPlaceholder } from '../../components/ui/MediaPlaceholder'
import { buttonClass } from '../../components/ui/Button'

/** Edit packs & tools (SPEC §4.7). */
export function Drops() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { linksBy } = useSiteData()

  return (
    <Section id="drops" eyebrow={t('drops.eyebrow')} title={t('drops.title')}>
      <Container>
        <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
          {linksBy('drops').map((d, i) => (
            <li key={d.id}>
              <Reveal
                delay={(i % 4) * 0.07}
                className="flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface"
              >
                <div className="relative aspect-square">
                  {d.coverUrl ? (
                    <img
                      src={d.coverUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <MediaPlaceholder label="TODO cover" className="size-full" />
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-3 p-3 md:p-4">
                  <div className="flex-1">
                    <h3 className="text-base leading-tight font-bold tracking-tight md:text-lg">
                      {d.title}
                    </h3>
                    {d.subtitle && (
                      <p className="mt-1 text-sm text-muted">{localize(d.subtitle, lang)}</p>
                    )}
                  </div>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass('outline', 'w-full px-3')}
                  >
                    {t('drops.getIt')} <ArrowUpRight className="size-4" aria-hidden="true" />
                    <span className="sr-only">: {d.title}</span>
                  </a>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
