import { ArrowUpRight } from 'lucide-react'
import { localize } from '@ajay/shared'
import type { LinkView } from '../../lib/data'
import { useLang } from '../../i18n'
import { SocialIcon } from '../../components/ui/SocialIcon'

/** Large, tappable list row for external links. */
export function LinkRow({ link }: { link: LinkView }) {
  const { lang } = useLang()
  const subtitle = localize(link.subtitle, lang)
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="pressable group flex min-h-16 items-center gap-4 border-b border-hairline py-3"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/90 group-hover:bg-accent">
        <SocialIcon icon={link.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-semibold tracking-tight">{link.title}</span>
        {subtitle && <span className="block truncate text-sm text-muted">{subtitle}</span>}
      </span>
      <ArrowUpRight
        className="size-5 shrink-0 text-white/40 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white"
        aria-hidden="true"
      />
    </a>
  )
}
