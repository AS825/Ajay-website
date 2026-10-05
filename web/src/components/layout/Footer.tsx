import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSiteData } from '../../lib/data'
import { SocialIcon } from '../ui/SocialIcon'
import { LanguageSwitch } from './LanguageSwitch'

export function Footer() {
  const { t } = useTranslation()
  const { site, linksBy } = useSiteData()
  return (
    <footer className="border-t border-hairline pb-[calc(6rem+var(--safe-bottom))] pt-12">
      <div className="px-safe mx-auto max-w-6xl">
        <p className="display-lg mb-8">
          {site.artistName}
          <span className="text-accent">.</span>
        </p>
        <ul className="-ml-3 mb-8 flex flex-wrap gap-1">
          {linksBy('social').map((l) => (
            <li key={l.id}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={l.subtitle ? `${l.title} – ${l.subtitle.en}` : l.title}
                className="pressable grid size-12 place-items-center rounded-full text-white/70 hover:text-white"
              >
                <SocialIcon icon={l.icon} />
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <nav aria-label="Legal" className="flex flex-wrap gap-x-6 gap-y-2">
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
          <LanguageSwitch className="self-start" />
        </div>
        <p className="mt-8 text-xs text-white/40">
          © {new Date().getFullYear()} {site.artistName}. {t('footer.rights')}
        </p>
      </div>
    </footer>
  )
}
