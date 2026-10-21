import { Link } from 'react-router-dom'
import { useSiteData } from '../../lib/data'
import { BRAND } from '../../lib/brand'

export function Logo() {
  const { theme, site } = useSiteData()
  return (
    <Link
      to="/"
      className="pressable flex min-h-12 items-center"
      aria-label={`${site.artistName} – Home`}
    >
      <img src={theme.logoUrl || BRAND.logo} alt="" className="h-10 w-auto" />
    </Link>
  )
}
