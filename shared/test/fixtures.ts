import type { EventDoc } from '../src/types'

export function makeEvent(over: Partial<EventDoc<Date>> = {}): EventDoc<Date> {
  return {
    slug: 'test-night',
    title: 'Test Night',
    startsAt: new Date('2026-10-15T20:00:00Z'),
    endsAt: new Date('2026-10-16T02:00:00Z'),
    venue: { name: 'Club X', address: 'Gürtel 1, 1090 Wien', mapsUrl: '' },
    flyerUrl: '',
    description: { en: 'A night, with "vibes"; and <tags>.', de: 'Eine Nacht.' },
    lineup: ['AJAY'],
    minAge: 18,
    status: 'published',
    guestlist: { enabled: true, capacity: 10, deadline: null, maxPlusOnes: 1, count: 0 },
    ticketing: { enabled: false, externalUrl: '' },
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...over,
  }
}
