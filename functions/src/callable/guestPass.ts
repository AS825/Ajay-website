import { timingSafeEqual } from 'node:crypto'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { FieldValue, getFirestore, type Timestamp } from 'firebase-admin/firestore'
import {
  guestPassRequestSchema,
  passUrl,
  type EventDoc,
  type GuestPassView,
  type Lang,
} from '@ajay/shared'
import { callableOptions, siteOrigin } from '../lib/env'
import { toDates } from '../lib/events'
import { qrPng } from '../lib/qr'
import { parseOrThrow } from '../lib/validate'
import { guestlistMail, type MailDoc } from '../mail/templates'

const sameToken = (a: string, b: string) =>
  a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

/** Guest pass page (/pass/:eventId/:entryId?t=…): returns the pass only for the right token. */
export const getGuestPass = onCall(callableOptions, async (req): Promise<GuestPassView> => {
  const { eventId, entryId, token } = parseOrThrow(guestPassRequestSchema, req.data)
  const db = getFirestore()
  const [entrySnap, eventSnap] = await Promise.all([
    db.doc(`events/${eventId}/guestlist/${entryId}`).get(),
    db.doc(`events/${eventId}`).get(),
  ])
  const entry = entrySnap.data()
  // Same answer for "no such entry" and "wrong token": nothing to probe.
  if (
    !entry ||
    !eventSnap.exists ||
    typeof entry.qrToken !== 'string' ||
    !sameToken(entry.qrToken, token)
  ) {
    throw new HttpsError('not-found', 'Pass not found.', { reason: 'notFound' })
  }
  const event = toDates(eventSnap.data() as EventDoc<Timestamp>)
  return {
    firstName: entry.firstName,
    lastName: entry.lastName,
    plusOnes: entry.plusOnes,
    status: entry.status,
    checkedIn: entry.checkedIn === true,
    event: {
      title: event.title,
      slug: event.slug,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt.toISOString(),
      venue: { name: event.venue.name, address: event.venue.address },
      flyerUrl: event.flyerUrl,
    },
  }
})

/**
 * Admin: move a guest from the waitlist to the guestlist (SPEC §10.5). Updates
 * the count in a transaction and mails the confirmation with the QR pass.
 * Over capacity only with `force` (the admin confirmed it).
 */
export const promoteGuest = onCall({ memory: '256MiB' }, async (req) => {
  if (req.auth?.token.admin !== true) throw new HttpsError('permission-denied', 'Admins only.')
  const { eventId, entryId, force } = (req.data ?? {}) as {
    eventId?: string
    entryId?: string
    force?: boolean
  }
  if (!eventId || !entryId) throw new HttpsError('invalid-argument', 'eventId/entryId missing.')
  const db = getFirestore()
  const eventRef = db.doc(`events/${eventId}`)
  const entryRef = eventRef.collection('guestlist').doc(entryId)

  const { entry, event } = await db.runTransaction(async (tx) => {
    const [ev, en] = await Promise.all([tx.get(eventRef), tx.get(entryRef)])
    if (!ev.exists || !en.exists)
      throw new HttpsError('not-found', 'Not found.', { reason: 'notFound' })
    const entry = en.data()!
    const event = toDates(ev.data() as EventDoc<Timestamp>)
    if (entry.status !== 'waitlist')
      throw new HttpsError('failed-precondition', 'Not on the waitlist.', { reason: 'notWaitlist' })
    const party = 1 + (entry.plusOnes ?? 0)
    if (!force && event.guestlist.count + party > event.guestlist.capacity) {
      throw new HttpsError('failed-precondition', 'Over capacity.', { reason: 'overCapacity' })
    }
    tx.update(entryRef, { status: 'confirmed' })
    tx.update(eventRef, { 'guestlist.count': FieldValue.increment(party) })
    return { entry, event }
  })

  const token = typeof entry.qrToken === 'string' ? entry.qrToken : null
  if (!token) return { ok: true, mailed: false }
  const url = passUrl(siteOrigin(), { eventId, entryId, token })
  const mail: MailDoc = {
    to: entry.email,
    message: guestlistMail({
      lang: (entry.lang as Lang) ?? 'en',
      status: 'confirmed',
      firstName: entry.firstName,
      plusOnes: entry.plusOnes,
      event,
      eventUrl: `${siteOrigin()}/events/${encodeURIComponent(event.slug)}`,
      passUrl: url,
      qrPng: await qrPng(url),
    }),
  }
  await db.collection('mail').add({ ...mail, createdAt: FieldValue.serverTimestamp() })
  return { ok: true, mailed: true }
})
