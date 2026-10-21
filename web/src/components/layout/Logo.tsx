import { Link } from 'react-router-dom'
import { useSiteData } from '../../lib/data'
import { BRAND } from '../../lib/brand'
import { useImageWithFallback } from '../../lib/hooks'

export function Logo() {
  const { theme, site } = useSiteData()
  const logo = useImageWithFallback(theme.logoUrl, BRAND.logo)
  return (
    <Link
      to="/"
      className="pressable flex min-h-12 items-center"
      aria-label={`${site.artistName} – Home`}
    >
      <img {...logo} alt="" className="h-10 w-auto" />
    </Link>
  )
}
