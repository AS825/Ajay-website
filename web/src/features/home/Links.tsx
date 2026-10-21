import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from 'lucide-react'
import { localize, type LinkCategory } from '@ajay/shared'
import { Reveal } from '../../components/motion/Reveal'
import { Section } from '../../components/ui/Section'
import { SocialIcon } from '../../components/ui/SocialIcon'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'
import { BRAND } from '../../lib/brand'
import { useImageWithFallback } from '../../lib/hooks'

const GROUPS: LinkCategory[] = ['social', 'streaming', 'sets', 'drops']

/**
 * All of Ajay's links in the Linktree layout (Linktree itself cannot be embedded):
 * avatar, handle, then one wide button per link, grouped.
 */
export function Links() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site, theme, linksBy } = useSiteData()
  const avatar = useImageWithFallback(theme.hero.imageUrl, BRAND.hero)
  const groups = GROUPS.map((g) => ({ id: g, links: linksBy(g) })).filter((g) => g.links.length)
  if (groups.length === 0) return null

  return (
    <Section id="links" title={t('links.title')} align="center">
      <div className="px-safe mx-auto max-w-xl">
        <Reveal className="mb-10 flex flex-col items-center text-center">
          <img
            {...avatar}
            alt={site.artistName}
            className="size-24 rounded-full bg-surface object-cover object-top"
          />
          <p className="mt-3 text-lg">@ajayadam</p>
        </Reveal>
        {groups.map((g) => (
          <div key={g.id} className="mb-8">
            <h3 className="mb-3 text-center text-sm font-bold tracking-[0.12em] uppercase">
              {t(`links.groups.${g.id}`)}
            </h3>
            <ul className="space-y-3">
              {g.links.map((l, i) => {
                const subtitle = localize(l.subtitle, lang)
                return (
                  <li key={l.id}>
                    <Reveal delay={Math.min(i, 6) * 0.04}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pressable relative flex min-h-14 items-center justify-center rounded-full bg-[#fff] px-14 py-3 text-center text-[#141110] shadow-[0_6px_20px_-12px_rgb(0_0_0/0.4)] transition-colors hover:bg-[#141110] hover:text-[#fff]"
                      >
                        <span className="absolute left-5">
                          <SocialIcon icon={l.icon} className="size-5" />
                        </span>
                        <span className="leading-tight">
                          <span className="block font-semibold">{l.title}</span>
                          {subtitle && <span className="block text-xs opacity-70">{subtitle}</span>}
                        </span>
                        <ArrowUpRight
                          className="absolute right-5 size-4 opacity-50"
                          aria-hidden="true"
                        />
                      </a>
                    </Reveal>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
