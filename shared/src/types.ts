/** Text that Ajay maintains in the admin. EN is required, DE falls back to EN. */
export interface Localized {
  en: string
  de?: string
}

/** Minimal shape shared by the web and admin SDK Timestamp classes. */
export interface TimestampLike {
  toDate(): Date
}

export type LinkCategory = 'social' | 'streaming' | 'sets' | 'drops'

/** Icon keys rendered by the web app (brand icons). */
export type IconKey =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'twitch'
  | 'soundcloud'
  | 'mixcloud'
  | 'bandcamp'
  | 'spotify'
  | 'applemusic'
  | 'amazonmusic'
  | 'deezer'
  | 'linktree'
  | 'paypal'
  | 'link'

export interface LinkDoc {
  title: string
  subtitle?: Localized
  url: string
  category: LinkCategory
  icon?: IconKey
  coverUrl?: string
  order: number
  visible: boolean
}

export type SectionId =
  'marquee' | 'events' | 'tiles' | 'music' | 'sets' | 'drops' | 'about' | 'booking' | 'support'

export interface SectionConfig {
  id: SectionId
  visible: boolean
}

export interface Tile {
  id: string
  title: string
  subtitle: Localized
  /** Internal path/anchor (e.g. "/#music", "/press") or external URL. */
  href: string
  imageUrl?: string
}

export interface SiteSettings {
  artistName: string
  aka: string
  city: string
  bookingEmail: string
  spotifyArtistUrl: string
  lectionUrl: string
  supportUrl: string
  bioShort: Localized
  bioLong: Localized
  genres: string[]
  aboutPhotos: string[]
  pressKitPdfUrl: string
  pressPhotos: string[]
  sections: SectionConfig[]
  tiles: Tile[]
  legal: {
    impressum: Localized
    datenschutz: Localized
    agb: Localized
  }
}

export type BackgroundType = 'color' | 'gradient' | 'image' | 'video'

export interface ThemeSettings {
  accentColor: string
  logoUrl: string
  marqueeText: string
  background: {
    type: BackgroundType
    color: string
    gradient: { colors: string[]; angle: number }
    mediaUrl: string
    /** 0–1, darkening overlay enforced on top of image/video backgrounds. */
    overlayOpacity: number
  }
  hero: {
    mediaType: 'none' | 'image' | 'video'
    imageUrl: string
    videoUrl: string
    posterUrl: string
    headline: string
    subline: Localized
    quote: Localized
  }
}

export type EventStatus = 'draft' | 'published'

export interface EventDoc<T = TimestampLike> {
  slug: string
  title: string
  startsAt: T
  endsAt: T
  venue: { name: string; address: string; mapsUrl: string }
  flyerUrl: string
  description: Localized
  lineup: string[]
  minAge: number | null
  dresscode?: Localized
  status: EventStatus
  guestlist: {
    enabled: boolean
    capacity: number
    deadline: T | null
    maxPlusOnes: number
    count: number
  }
  ticketing: {
    /** Own ticket sales (PayPal) – deferred feature, always false for now. */
    enabled: boolean
    externalUrl: string
  }
  createdAt: T
}
