import type { EventDoc, Localized } from '@ajay/shared'
import { dateToViennaLocal } from '@ajay/shared'

type EventInfo = Partial<Pick<EventDoc, 'slug' | 'title' | 'lineup' | 'minAge'>> & {
  description?: Localized
  venueName?: string
}

/**
 * Event texts that ship with the site, keyed by event day (like the flyers).
 * They override what was typed in the admin for that day.
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
