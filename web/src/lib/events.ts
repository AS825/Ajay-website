import type { EventDoc } from '@ajay/shared'

export type EventView = EventDoc<Date> & { id: string }

export type EventBadge = 'guestlistOpen' | 'guestlistFull' | 'tickets' | 'soldOut' | 'past' | null

/** Status badge for event cards (SPEC §4.3 / §6). Own ticket sales are deferred. */
export function eventBadge(e: EventView, now = new Date()): EventBadge {
  if (e.endsAt < now) return 'past'
  const g = e.guestlist
  if (g.enabled) {
    const closed = g.count >= g.capacity || (g.deadline !== null && g.deadline < now)
    if (!closed) return 'guestlistOpen'
    if (!e.ticketing.externalUrl) return 'guestlistFull'
  }
  if (e.ticketing.externalUrl) return 'tickets'
  return null
}

export function isUpcoming(e: EventView, now = new Date()) {
  return e.endsAt >= now
}
