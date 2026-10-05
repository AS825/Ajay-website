import type { Timestamp } from 'firebase-admin/firestore'
import type { EventDoc } from '@ajay/shared'

export function toDates(d: EventDoc<Timestamp>): EventDoc<Date> {
  return {
    ...d,
    startsAt: d.startsAt.toDate(),
    endsAt: d.endsAt.toDate(),
    createdAt: d.createdAt.toDate(),
    guestlist: { ...d.guestlist, deadline: d.guestlist.deadline?.toDate() ?? null },
  }
}
