import { createHash } from 'node:crypto'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import {
  eventState,
  guestlistSchema,
  type EventDoc,
  type GuestlistStatus,
  type JoinGuestlistResult,
} from '@ajay/shared'
import { callableOptions, siteOrigin } from '../lib/env'
import { clientIp, enforceRateLimit } from '../lib/rateLimit'
import { parseOrThrow } from '../lib/validate'
import { guestlistMail, type MailDoc } from '../mail/templates'

const fail = (
  code: 'failed-precondition' | 'not-found' | 'already-exists' | 'invalid-argument',
  reason: string,
) => new HttpsError(code, reason, { reason })

function toDates(d: EventDoc<Timestamp>): EventDoc<Date> {
  return {
    ...d,
    startsAt: d.startsAt.toDate(),
    endsAt: d.endsAt.toDate(),
    createdAt: d.createdAt.toDate(),
    guestlist: { ...d.guestlist, deadline: d.guestlist.deadline?.toDate() ?? null },
  }
}

/**
 * Guestlist sign-up (SPEC §7). Runs in a transaction: checks the event is
 * published and open, deadline, duplicates (one entry per e-mail and event)
 * and capacity. Capacity counts people (guest + plus-ones); when full, the
 * entry is stored as "waitlist" without counting. The confirmation mail is
 * queued in the same transaction.
 */
export const joinGuestlist = onCall(callableOptions, async (req): Promise<JoinGuestlistResult> => {
  const input = parseOrThrow(guestlistSchema, req.data)

  // Honeypot filled → pretend success, store nothing.
  if (input.website) return { status: 'confirmed' }

  const email = input.email.trim().toLowerCase()
  await enforceRateLimit('guestlist_ip', clientIp(req), 10, 10 * 60_000)
  await enforceRateLimit('guestlist_email', email, 5, 24 * 60 * 60_000)

  const db = getFirestore()
  const eventRef = db.collection('events').doc(input.eventId)
  // Deterministic id → duplicate check is a single read inside the transaction.
  const entryRef = eventRef
    .collection('guestlist')
    .doc(createHash('sha256').update(email).digest('hex').slice(0, 32))

  const status = await db.runTransaction(async (tx): Promise<GuestlistStatus> => {
    const [eventSnap, entrySnap] = await Promise.all([tx.get(eventRef), tx.get(entryRef)])
    if (!eventSnap.exists) throw fail('not-found', 'notFound')
    const event = toDates(eventSnap.data() as EventDoc<Timestamp>)
    if (event.status !== 'published') throw fail('not-found', 'notFound')

    const state = eventState(event)
    if (state.isPast) throw fail('failed-precondition', 'past')
    if (state.guestlist === 'disabled' || state.guestlist === 'closed')
      throw fail('failed-precondition', 'closed')
    if (input.plusOnes > event.guestlist.maxPlusOnes)
      throw fail('invalid-argument', 'tooManyPlusOnes')
    if (entrySnap.exists) throw fail('already-exists', 'duplicate')

    const party = 1 + input.plusOnes
    const fits = event.guestlist.count + party <= event.guestlist.capacity
    const result: GuestlistStatus = fits ? 'confirmed' : 'waitlist'

    tx.set(entryRef, {
      firstName: input.firstName,
      lastName: input.lastName,
      email,
      phone: input.phone ?? '',
      plusOnes: input.plusOnes,
      status: result,
      checkedIn: false,
      newsletter: input.newsletter,
      privacyAcceptedAt: FieldValue.serverTimestamp(),
      lang: input.lang,
      createdAt: FieldValue.serverTimestamp(),
    })
    if (fits) tx.update(eventRef, { 'guestlist.count': FieldValue.increment(party) })

    const mail: MailDoc = {
      to: email,
      message: guestlistMail({
        lang: input.lang,
        status: result,
        firstName: input.firstName,
        plusOnes: input.plusOnes,
        event,
        eventUrl: `${siteOrigin()}/events/${encodeURIComponent(event.slug)}`,
      }),
    }
    tx.set(db.collection('mail').doc(), { ...mail, createdAt: FieldValue.serverTimestamp() })
    return result
  })

  return { status }
})
