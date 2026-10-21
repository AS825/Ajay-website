import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { IconKey } from '@ajay/shared'
import { useSiteData } from '../../lib/data'
import { SocialIcon } from '../ui/SocialIcon'
import { LanguageSwitch } from './LanguageSwitch'

const FOOTER_ICONS: IconKey[] = ['instagram', 'youtube', 'tiktok']

/** Social icons (Instagram, YouTube, TikTok), legal links and language. */
export function Footer() {
  const { t } = useTranslation()
  const { site, linksBy } = useSiteData()
  const social = linksBy('social')
  const icons = FOOTER_ICONS.map((icon) => social.find((l) => l.icon === icon)).filter(
    (l) => l !== undefined,
  )

  return (
    <footer className="border-t border-hairline pt-10 pb-[calc(6rem+var(--safe-bottom))] md:pb-12">
      <div className="px-safe mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <ul className="flex gap-2">
          {icons.map((l) => (
            <li key={l.id}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={l.title}
                className="pressable grid size-12 place-items-center rounded-full border border-hairline transition-colors hover:bg-white hover:text-black"
              >
                <SocialIcon icon={l.icon} className="size-5" />
              </a>
            </li>
          ))}
        </ul>
        <nav
          aria-label="Legal"
          className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted"
        >
          <Link to="/impressum" className="hover:text-white">
            {t('footer.imprint')}
          </Link>
          <Link to="/datenschutz" className="hover:text-white">
            {t('footer.privacy')}
          </Link>
          <Link to="/agb" className="hover:text-white">
            {t('footer.terms')}
          </Link>
          <a href={`mailto:${site.bookingEmail}`} className="hover:text-white">
            {site.bookingEmail}
          </a>
        </nav>
        <LanguageSwitch />
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} {site.artistName}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  )
}
