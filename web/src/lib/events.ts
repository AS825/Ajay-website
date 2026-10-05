import { eventState, type EventDoc } from '@ajay/shared'

export type EventView = EventDoc<Date> & { id: string }

export type EventBadge = 'live' | 'guestlistOpen' | 'guestlistFull' | 'tickets' | 'past' | null

/** Status badge for event cards (SPEC §4.3 / §6). Own ticket sales are deferred. */
export function eventBadge(e: EventView, now = new Date()): EventBadge {
  const s = eventState(e, now)
  if (s.isPast) return 'past'
  if (s.isLive) return 'live'
  if (s.guestlist === 'open') return 'guestlistOpen'
  if (s.externalTickets) return 'tickets'
  if (s.guestlist === 'full') return 'guestlistFull'
  return null
}

export function isUpcoming(e: EventView, now = new Date()) {
  return e.endsAt >= now
}
