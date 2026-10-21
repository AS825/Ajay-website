import { Link } from 'react-router-dom'
import { useSiteData } from '../../lib/data'
import { BRAND } from '../../lib/brand'
import { NowPlaying } from '../motion/Dj'

export function Logo() {
  const { theme, site } = useSiteData()
  const logo = theme.logoUrl || (theme.style === 'sand' ? BRAND.logo : '')
  return (
    <Link
      to="/"
      className="pressable flex min-h-12 items-center"
      aria-label={`${site.artistName} – Home`}
    >
      {logo ? (
        <img src={logo} alt="" className="h-10 w-auto" />
      ) : (
        <span className="text-lg font-extrabold tracking-[-0.04em]">
          {site.aka}
          <span className="text-accent">.</span>
        </span>
      )}
      <NowPlaying className="ml-2.5" />
    </Link>
  )
}
