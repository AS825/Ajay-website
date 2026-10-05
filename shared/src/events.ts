import type { EventDoc } from './types'

export type GuestlistState = 'disabled' | 'open' | 'full' | 'closed'

export interface EventState {
  isPast: boolean
  isLive: boolean
  /** open → join; full → join the waitlist (SPEC §7); closed → deadline passed. */
  guestlist: GuestlistState
  externalTickets: boolean
}

/** Single source of truth for event status (SPEC §6), used by web and functions. */
export function eventState(e: EventDoc<Date>, now: Date = new Date()): EventState {
  const isPast = e.endsAt < now
  const isLive = !isPast && e.startsAt <= now
  const g = e.guestlist
  let guestlist: GuestlistState = 'disabled'
  if (g.enabled && !isPast) {
    if (g.deadline !== null && g.deadline < now) guestlist = 'closed'
    else if (g.count >= g.capacity) guestlist = 'full'
    else guestlist = 'open'
  }
  return { isPast, isLive, guestlist, externalTickets: !isPast && !!e.ticketing.externalUrl }
}

export function googleMapsUrl(venue: EventDoc['venue']): string {
  if (venue.mapsUrl) return venue.mapsUrl
  const q = [venue.name, venue.address].filter(Boolean).join(', ')
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
}

export function appleMapsUrl(venue: EventDoc['venue']): string {
  const q = [venue.name, venue.address].filter(Boolean).join(', ')
  return `https://maps.apple.com/?q=${encodeURIComponent(q)}`
}
