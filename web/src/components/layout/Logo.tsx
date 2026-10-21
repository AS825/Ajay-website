import { Link } from 'react-router-dom'
import { useSiteData } from '../../lib/data'
import { NowPlaying } from '../motion/Dj'

export function Logo() {
  const { theme, site } = useSiteData()
  return (
    <Link
      to="/"
      className="pressable flex min-h-12 items-center"
      aria-label={`${site.artistName} – Home`}
    >
      {theme.logoUrl ? (
        <img src={theme.logoUrl} alt="" className="h-7 w-auto" />
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
