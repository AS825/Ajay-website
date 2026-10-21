import {
  siApplemusic,
  siBandcamp,
  siDeezer,
  siInstagram,
  siLinktree,
  siMixcloud,
  siPaypal,
  siSoundcloud,
  siSpotify,
  siTiktok,
  siTwitch,
  siYoutube,
  type SimpleIcon,
} from 'simple-icons'
import { Link2, Music } from 'lucide-react'
import type { IconKey } from '@ajay/shared'

const BRAND: Partial<Record<IconKey, SimpleIcon>> = {
  instagram: siInstagram,
  tiktok: siTiktok,
  youtube: siYoutube,
  twitch: siTwitch,
  soundcloud: siSoundcloud,
  mixcloud: siMixcloud,
  bandcamp: siBandcamp,
  spotify: siSpotify,
  applemusic: siApplemusic,
  deezer: siDeezer,
  linktree: siLinktree,
  paypal: siPaypal,
}

export function SocialIcon({
  icon,
  className = 'size-5',
  colored = false,
}: {
  icon?: IconKey
  className?: string
  /** Use the platform's brand colour instead of the text colour. */
  colored?: boolean
}) {
  const brand = icon ? BRAND[icon] : undefined
  if (brand) {
    return (
      <svg
        viewBox="0 0 24 24"
        className={className}
        fill={colored ? `#${brand.hex}` : 'currentColor'}
        aria-hidden="true"
      >
        <path d={brand.path} />
      </svg>
    )
  }
  const Fallback = icon === 'amazonmusic' ? Music : Link2
  return <Fallback className={className} aria-hidden="true" />
}
