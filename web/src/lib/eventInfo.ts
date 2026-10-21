import type { EventDoc, Localized } from '@ajay/shared'
import { dateToViennaLocal, viennaLocalToDate } from '@ajay/shared'
import { bundledFlyer } from './flyers'
import type { EventView } from './events'

type EventInfo = Partial<Pick<EventDoc, 'slug' | 'title' | 'lineup' | 'minAge'>> & {
  description?: Localized
  venueName?: string
  address?: string
  /** Vienna time "HH:MM"; an end before the start means the next morning. */
  start?: string
  end?: string
  guestlistUrl?: string
}

/**
 * Events that ship with the site, keyed by event day (flyers live next to them in
 * assets/flyers). For a day that also has an event in the admin, these fields
 * override it; otherwise a complete entry (title + start) becomes an event of its own.
 */
const EVENT_INFO: Record<string, EventInfo> = {
  '2026-10-30': {
    slug: 'pre-halloween-party',
    title: 'Pre Halloween Party 🎃',
    venueName: 'Vie i Pee',
    lineup: ['AJAY', 'MO'],
    minAge: null,
    description: {
      en: `LECTION – Where music meets culture. 🖤
Eine Nacht, die du nicht planen kannst, sondern erleben musst.

🗓️ FRIDAY 30/10/26
💃 LADIES SPECIAL: Free entry until midnight
⏰ START: 23:00
🎧 AJAY | MO

Keine Ausreden. Kein Drama. Nur Beats, Drinks & Good Vibes 💯

Afrobeats x Dancehall x Reggaeton and more …`,
    },
  },
}

export function bundledEventInfo(startsAt: Date): EventInfo | undefined {
  return EVENT_INFO[dateToViennaLocal(startsAt).slice(0, 10)]
}

/** Complete events from EVENT_INFO for days that have no event in the admin. */
export function bundledEvents(taken: Set<string>): EventView[] {
  return Object.entries(EVENT_INFO)
    .filter(([day, info]) => !taken.has(day) && info.title && info.start)
    .map(([day, info]) => {
      const startsAt = viennaLocalToDate(`${day}T${info.start}`)
      let endsAt = viennaLocalToDate(`${day}T${info.end ?? '05:00'}`)
      if (endsAt <= startsAt) endsAt = new Date(endsAt.getTime() + 86_400_000)
      return {
        id: `bundled-${day}`,
        slug: info.slug ?? day,
        title: info.title!,
        startsAt,
        endsAt,
        createdAt: startsAt,
        venue: { name: info.venueName ?? '', address: info.address ?? '', mapsUrl: '' },
        flyerUrl: bundledFlyer(startsAt) ?? '',
        description: info.description ?? { en: '' },
        lineup: info.lineup ?? ['AJAY'],
        minAge: info.minAge ?? null,
        status: 'published' as const,
        guestlist: {
          externalUrl: info.guestlistUrl ?? '',
          enabled: false,
          capacity: 0,
          deadline: null,
          maxPlusOnes: 0,
          count: 0,
        },
        ticketing: { enabled: false, externalUrl: '' },
      }
    })
}

/** Vienna day of an event, the key used for flyers and EVENT_INFO. */
export const eventDay = (d: Date) => dateToViennaLocal(d).slice(0, 10)
