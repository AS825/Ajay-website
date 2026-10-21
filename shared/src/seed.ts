import type { LinkDoc, SectionConfig, SiteSettings, ThemeSettings } from './types'

/**
 * Initial content from Ajay's Linktree (SPEC §5). Written to Firestore by
 * `npm run seed`; Firestore is the source of truth afterwards.
 */
export const seedLinks: Record<string, LinkDoc> = {
  // Social
  instagram: {
    title: 'Instagram',
    url: 'https://www.instagram.com/ajay.adam',
    category: 'social',
    icon: 'instagram',
    order: 10,
    visible: true,
  },
  tiktok: {
    title: 'TikTok',
    url: 'https://www.tiktok.com/@ajay_adam',
    category: 'social',
    icon: 'tiktok',
    order: 20,
    visible: true,
  },
  youtubeMain: {
    title: 'YouTube',
    subtitle: { en: 'AJAY' },
    url: 'https://www.youtube.com/channel/UCbarwFBxhndGVWTjlznesKg',
    category: 'social',
    icon: 'youtube',
    order: 30,
    visible: true,
  },
  youtubeEdits: {
    title: 'YouTube',
    subtitle: { en: 'Edits, Remixes & Live Sets', de: 'Edits, Remixes & Live-Sets' },
    url: 'https://www.youtube.com/channel/UCga2Gfg9z_rMUor-uY7Vsog',
    category: 'social',
    icon: 'youtube',
    order: 40,
    visible: true,
  },
  twitch: {
    title: 'Twitch',
    url: 'https://www.twitch.tv/ajayadam',
    category: 'social',
    icon: 'twitch',
    order: 50,
    visible: true,
  },
  soundcloud1: {
    title: 'SoundCloud',
    subtitle: { en: 'ajay-adam' },
    url: 'https://soundcloud.com/ajay-adam',
    category: 'social',
    icon: 'soundcloud',
    order: 60,
    visible: true,
  },
  soundcloud2: {
    title: 'SoundCloud',
    subtitle: { en: 'ajayadam2' },
    url: 'https://soundcloud.com/ajayadam2',
    category: 'social',
    icon: 'soundcloud',
    order: 70,
    visible: true,
  },
  mixcloud: {
    title: 'Mixcloud',
    subtitle: { en: 'Mixtapes' },
    url: 'https://www.mixcloud.com/ajayadam/',
    category: 'social',
    icon: 'mixcloud',
    order: 80,
    visible: true,
  },
  bandcamp: {
    title: 'Bandcamp',
    url: 'https://ajaydeejay.bandcamp.com',
    category: 'social',
    icon: 'bandcamp',
    order: 90,
    visible: true,
  },

  // Streaming
  spotify: {
    title: 'Spotify',
    url: 'https://open.spotify.com/artist/2e7t4A3yqveh7uPvrjeAYF',
    category: 'streaming',
    icon: 'spotify',
    order: 10,
    visible: true,
  },
  appleMusic: {
    title: 'Apple Music',
    url: 'https://music.apple.com/at/artist/ajay-adam/1545704921',
    category: 'streaming',
    icon: 'applemusic',
    order: 20,
    visible: true,
  },
  amazonMusic: {
    title: 'Amazon Music',
    url: 'https://music.amazon.de/artists/B08R1MJHWZ/ajay-adam',
    category: 'streaming',
    icon: 'amazonmusic',
    order: 30,
    visible: true,
  },
  deezer: {
    title: 'Deezer',
    url: 'https://www.deezer.com/de/artist/117403062',
    category: 'streaming',
    icon: 'deezer',
    order: 40,
    visible: true,
  },
  playlists: {
    title: 'Spotify Playlists',
    subtitle: { en: 'All playlists', de: 'Alle Playlists' },
    url: 'https://linktr.ee/playlistbyajay',
    category: 'streaming',
    icon: 'spotify',
    order: 50,
    visible: true,
  },

  // Sets & video
  lectionSets: {
    title: 'LECTION DJ Sets',
    subtitle: { en: 'Playlist' },
    url: 'https://www.youtube.com/watch?v=C_EhCu7DxhM&list=PLHcdhMen3mzZInnkiHkOnvG5T9k1yIrTh',
    category: 'sets',
    icon: 'youtube',
    order: 10,
    visible: true,
  },
  lection15: {
    title: 'LECTION #15 – Cabrio Session Set 2026',
    url: 'https://www.youtube.com/watch?v=cmGj8P4FfV0',
    category: 'sets',
    icon: 'youtube',
    order: 20,
    visible: true,
  },
  featuredVideo: {
    // TODO(Ajay): real title – editable in Admin → Links → Sets.
    title: 'Featured Video',
    url: 'https://www.youtube.com/watch?v=68r066j96Mg',
    category: 'sets',
    icon: 'youtube',
    order: 5,
    visible: true,
  },
  fullSets: {
    title: 'Full DJ Sets',
    subtitle: { en: 'Video playlist', de: 'Video-Playlist' },
    url: 'https://youtube.com/playlist?list=PLJD69D0gv_ZwxS6aPekwRjRlgYcP4Ra1s',
    category: 'sets',
    icon: 'youtube',
    order: 30,
    visible: true,
  },

  // Drops
  loopTools01: {
    title: 'Loop Tools 01',
    subtitle: { en: '1500+ Sounds' },
    url: 'https://ajayvienna.gumroad.com/l/ajaylooptools01',
    category: 'drops',
    order: 10,
    visible: true,
  },
  cheatCodes1: {
    title: 'DJ Cheat Codes Vol. 1',
    url: 'https://ajaydeejay.bandcamp.com/album/cheat-codes-vol-1',
    category: 'drops',
    icon: 'bandcamp',
    order: 20,
    visible: true,
  },
  cheatCodes2: {
    title: 'DJ Cheat Codes Vol. 2',
    url: 'https://ajaydeejay.bandcamp.com/album/cheat-codes-vol-2',
    category: 'drops',
    icon: 'bandcamp',
    order: 30,
    visible: true,
  },
  allEdits2025: {
    title: 'All Edits Pack 2025',
    url: 'https://hypeddit.com/ajayadam/xmas2025pack',
    category: 'drops',
    order: 40,
    visible: true,
  },
  wanted7: {
    title: 'WANTED.7',
    subtitle: { en: 'Club Edit Pack' },
    url: 'TODO',
    category: 'drops',
    order: 50,
    visible: false,
  },
}

const TODO_LEGAL = { en: 'TODO: legal text to be provided.', de: 'TODO: Rechtstext folgt.' }

export const seedSite: SiteSettings = {
  artistName: 'AJAY ADAM',
  aka: 'AJAY',
  city: 'Vienna (Austria)',
  bookingEmail: 'booking@ajay.at',
  spotifyArtistUrl: 'https://open.spotify.com/artist/2e7t4A3yqveh7uPvrjeAYF',
  lectionUrl: 'https://www.instagram.com/lection.vie/',
  supportUrl: 'https://www.paypal.com/paypalme/ajayadam',
  // From the 2027 press kit.
  bioShort: {
    en: 'Meet Ajay, AKA Adam S., born in the 90s in Vienna. As a wee one, he stumbled upon his love for music and tinkered with every sound he could get his hands on. Music was his jam, and he rocked at it! He even taught himself the piano by age 5 and then went on to master other instruments. His talent was undeniable, and soon enough, he was shining bright in talent shows and music events.\n\nBy 14, he was ready for more and dove into making his own music, blending the best of both acoustic and digital worlds. Ajay was a perfectionist and made it his mission to create the most ear-pleasing tunes. Soon enough, he was unstoppable, and at 16, he decided to try his hand at DJing, churning out epic mixtapes, mashups, and remixes. No surprise that he quickly became a crowd favorite!',
  },
  bioLong: { en: 'TODO: long bio from Ajay.', de: 'TODO: Lange Bio von Ajay.' },
  genres: ['Afro', 'Baile Funk', 'Latin', 'Bouyon', 'Edits'],
  aboutPhotos: [],
  facts: [
    { en: 'Real Name: Adam Sacipi', de: 'Bürgerlicher Name: Adam Sacipi' },
    { en: 'Location: Vienna (AUT)', de: 'Wohnort: Wien (AUT)' },
    { en: 'Club resident: Vie i Pee (VIE)', de: 'Club-Resident: Vie i Pee (VIE)' },
    { en: 'DJ since: 2013', de: 'DJ seit: 2013' },
    { en: 'Performance Club DJ' },
    { en: 'Club, Festival, Open Air' },
    { en: 'Set: 1–4 hours', de: 'Set: 1–4 Stunden' },
    {
      en: 'Musical talents: Guitar, Piano, Percussion & many more',
      de: 'Instrumente: Gitarre, Klavier, Percussion & vieles mehr',
    },
  ],
  infoPhoto: '',
  stats: [
    {
      icon: 'spotify',
      label: { en: 'Spotify streams', de: 'Spotify-Streams' },
      value: '8M+',
      url: 'https://open.spotify.com/artist/2e7t4A3yqveh7uPvrjeAYF',
    },
    {
      icon: 'youtube',
      label: { en: 'YouTube followers', de: 'YouTube-Follower' },
      value: '120K+',
      url: 'https://www.youtube.com/channel/UCbarwFBxhndGVWTjlznesKg',
    },
    {
      icon: 'instagram',
      label: { en: 'Instagram followers', de: 'Instagram-Follower' },
      value: '80K+',
      url: 'https://www.instagram.com/ajay.adam',
    },
    {
      icon: 'tiktok',
      label: { en: 'TikTok followers', de: 'TikTok-Follower' },
      value: '390K+',
      url: 'https://www.tiktok.com/@ajay_adam',
    },
    {
      icon: 'soundcloud',
      label: { en: 'SoundCloud followers', de: 'SoundCloud-Follower' },
      value: '50K+',
      url: 'https://tr.ee/Ki8idrmK8V',
    },
  ],
  venues: {
    austria: [
      'Vie i Pee (RSD DJ)',
      'Lutz',
      'Club Couture',
      'Box / Damdam',
      'Platzhirsch',
      'Volksgarten',
      'O Klub',
      'INC',
      'Passage',
      'The Club',
      'Take 5',
      'Citybeats',
      'Pyramide',
      'Empire',
      'Hidden',
    ],
    international: [
      'Cova Cannes (Paris)',
      'Cova Paris (Paris)',
      'Matignon (Paris)',
      'The Room (Hamburg)',
      'Bricks (Berlin)',
      'Pineta (Milan)',
      'Gibson (Frankfurt)',
      'Beach Oeiras (Lisbon)',
      'Libertine (London)',
      'Apollo (Milan)',
      'Chrystie (Cannes)',
      'Moxy Rooftop (NYC)',
      'Jade (Zürich)',
      'Face Club (Basel)',
      'Naya Club (Cannes)',
    ],
  },
  venuesPhoto: '',
  riderPhoto: '',
  artists: [
    'Big Sean',
    'J Capri',
    'Rema',
    'Kid Ink',
    'Lloyd Banks',
    'Sean Kingston',
    'Les Twins',
    'Justin Bieber',
    'Luciano',
    'Omarion',
    'G-Eazy',
    'DMX',
    'Dystinct',
    'Tribal Kush',
    'Kybba',
    'Ayra Starr',
    'Rick Ross',
    'Playboi Carti',
    'Jaleel',
    'A$AP Ferg',
    'Skepta',
    'OZ',
    'Shindy',
    'Central Cee',
    'Busta',
  ],
  artistsPhoto: '',
  productions: {
    remixes: [
      'Candy Shop RMX 150K+',
      'Deli x Family Ties RMX 100K+',
      'Wildberry RMX 100K+',
      'Sweet Dreams RMX 100K+',
      'Closer RMX 115K+',
      'Me, Myself and I RMX 80K+',
      'Gasolina RMX 70K+',
      'Heads Will Roll 87K+',
      'Drunk in Love RMX 50K+',
      'Milkshake RMX 30K+',
      'Englishman in NY RMX 100K+',
      'Just Wanna Mashup 200K+',
      "Drop It Like It's Hot RMX 100K+",
      'Search & Rescue RMX 90K+',
      'Sure Thing RMX 40K+',
      'Last Last RMX 40K+',
      'Active RMX 30K+',
      'Say My Name RMX 60K+',
    ],
    tracks: [
      'Tory Lanez – Florida Shit',
      'Trey Songz – Who Let You Down',
      'Maître Gims – Habibi (Remix)',
      'Nazar – Moazzaik (Album)',
      'Nazar – DNA (Album)',
      'Nazar – No Go',
      'Schwesta Ewa – Türsteher',
      'KS – Vibe',
      'Disney+ Show – Dave',
      'Yaw Mini – Lean',
      'Ardian Bujupi – Marylin Monroe',
      'Remoe – Sie liebt es',
      'MC Yankoo – Balkan Mädchen',
      'MC Yankoo – Amalilja',
      'PPay – Merbargeld',
      'Remoe – Kontakte',
    ],
  },
  contactUrl: 'https://linktr.ee/ajayadam',
  pressKitUrl: 'https://e.pcloud.link/publink/show?code=kZ3sC77Zq5ls0hfjSBbkkJNYGU8g781jJow7',
  guestlistUrl:
    'https://getguestlist.io/signup?l=469768da-f313-4cb9&d=guestlist&code=Lection_insta',
  rider: {
    gear: ['2 × Pioneer CDJs (2000 or higher)', '1 × Pioneer DJM S9 / S7 / S11'],
    note: {
      en: 'Please note that I also need a laptop stand and enough space to work with.',
      de: 'Bitte beachten: Ich brauche außerdem einen Laptop-Ständer und genug Platz zum Arbeiten.',
    },
  },
  liveSetsUrl: 'https://www.youtube.com/playlist?list=PLJD69D0gv_ZwxS6aPekwRjRlgYcP4Ra1s',
  contactPhoto: '',
  pressKitPdfUrl: '',
  pressPhotos: [],
  sections: [
    { id: 'events', visible: true },
    { id: 'about', visible: true },
    { id: 'info', visible: true },
    { id: 'stats', visible: true },
    { id: 'venues', visible: true },
    { id: 'artists', visible: true },
    { id: 'produced', visible: true },
    { id: 'rider', visible: true },
    { id: 'livesets', visible: true },
    { id: 'links', visible: true },
    { id: 'contact', visible: true },
  ],
  legal: { impressum: TODO_LEGAL, datenschutz: TODO_LEGAL, agb: TODO_LEGAL },
}

export const seedTheme: ThemeSettings = {
  logoUrl: '',
  hero: {
    imageUrl: '',
    subline: { en: 'DJ & PRODUCER', de: 'DJ & PRODUCER' },
    quote: { en: 'VIENNA', de: 'WIEN' },
  },
}

/**
 * Brings a stored section list up to date with the sections the code knows.
 * Lists from an old site layout (ids like "marquee", or the first press-kit order) start over
 * in the press-kit order, keeping only the visibility of blocks that still exist.
 * Otherwise new ids are inserted after their predecessor in the default order.
 */
/** The first press-kit order (events near the end); saved lists in this order get the current default. */
const FIRST_PRESS_KIT_ORDER = 'about,info,stats,venues,rider,livesets,events,contact'

export function normalizeSections(stored: SectionConfig[] | undefined): SectionConfig[] {
  const known = seedSite.sections.map((s) => s.id)
  const legacy =
    (stored ?? []).some((s) => !known.includes(s.id)) ||
    (stored ?? []).map((s) => s.id).join(',') === FIRST_PRESS_KIT_ORDER
  if (legacy) {
    return seedSite.sections.map((s) => ({
      ...s,
      visible: stored!.find((x) => x.id === s.id)?.visible ?? true,
    }))
  }
  const list = [...(stored ?? [])]
  for (const [i, id] of known.entries()) {
    if (list.some((s) => s.id === id)) continue
    const prev = known
      .slice(0, i)
      .reverse()
      .find((p) => list.some((s) => s.id === p))
    const at = prev ? list.findIndex((s) => s.id === prev) + 1 : 0
    list.splice(at, 0, { id, visible: true })
  }
  return list
}
