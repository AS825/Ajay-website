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

/** Home page blocks, in the order of the press kit. */
export type SectionId =
  | 'events'
  | 'about'
  | 'info'
  | 'stats'
  | 'venues'
  | 'artists'
  | 'produced'
  | 'rider'
  | 'livesets'
  | 'links'
  | 'contact'

export interface SectionConfig {
  id: SectionId
  visible: boolean
}

/** One row of the "Media statistics" block (press kit). */
export interface StatItem {
  icon: IconKey
  label: Localized
  /** Shown as typed, e.g. "8M+"; the leading number counts up on screen. */
  value: string
  /** Profile the row links to. */
  url?: string
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
  /** Press-kit blocks on the home page: key facts, media statistics, venues played. */
  facts: Localized[]
  infoPhoto: string
  stats: StatItem[]
  venues: { austria: string[]; international: string[] }
  venuesPhoto: string
  riderPhoto: string
  /** "Artist support": artists Ajay played for / with. */
  artists: string[]
  artistsPhoto: string
  /** "Produced by Ajay": remixes (left column) and productions (right column). */
  productions: { remixes: string[]; tracks: string[] }
  /** Where "click here" in the contact block leads. */
  contactUrl: string
  /** Press kit download (menu and mobile navigation). */
  pressKitUrl: string
  /** Guestlist page for events that have no link of their own. */
  guestlistUrl: string
  /** Technical rider: one line per piece of gear, plus a note. */
  rider: { gear: string[]; note: Localized }
  /** YouTube playlist with live sets (shown with a QR code). */
  liveSetsUrl: string
  contactPhoto: string
  pressKitPdfUrl: string
  pressPhotos: string[]
  sections: SectionConfig[]
  legal: {
    impressum: Localized
    datenschutz: Localized
    agb: Localized
  }
}

export interface ThemeSettings {
  /** Empty: the press-kit logo shipped with the site. */
  logoUrl: string
  hero: {
    /** Portrait cut-out on the right; empty: the press-kit photo. */
    imageUrl: string
    /** Two short lines under the logo (press kit: "PRESS KIT" / "2027"). */
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
    /** External sign-up page (e.g. getguestlist.io); replaces the own guestlist when set. */
    externalUrl?: string
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

/** Latest uploads from Ajay's YouTube channels, synced by the `syncFeeds` function. */
export interface FeedVideo {
  id: string
  title: string
  publishedAt: string
  /** Thumbnail copied to our Storage – no request to Google before the visitor taps play. */
  thumbUrl: string
  channelTitle: string
}

/** Latest Instagram posts (Instagram API), images copied to our Storage. */
export interface FeedPost {
  id: string
  caption: string
  permalink: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  imageUrl: string
  timestamp: string
}

export interface FeedDoc<T> {
  items: T[]
  updatedAt: string | null
  /** Last error message (shown in the admin), empty when the last sync worked. */
  error: string
}
