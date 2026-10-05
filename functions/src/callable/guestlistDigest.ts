import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { logger } from 'firebase-functions'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { toCsv, type EventDoc } from '@ajay/shared'
import { siteOrigin } from '../lib/env'
import { toDates } from '../lib/events'
import { guestlistDigestMail, type DigestGuest, type MailDoc } from '../mail/templates'

/** Recipients: GUESTLIST_EMAILS, else ADMIN_EMAILS (functions/.env). */
function recipients(): string[] {
  const raw = process.env.GUESTLIST_EMAILS?.trim() || process.env.ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

/** Queues the guest list mail for one event. Returns the number of entries. */
async function sendDigest(eventId: string, extraRecipient?: string): Promise<number> {
  const db = getFirestore()
  const eventRef = db.doc(`events/${eventId}`)
  const snap = await eventRef.get()
  if (!snap.exists) throw new HttpsError('not-found', 'Event not found.')
  const event = toDates(snap.data() as EventDoc<Timestamp>)
  const entries = await eventRef.collection('guestlist').get()
  const guests = entries.docs.map((d) => d.data() as DigestGuest)
  const to = [...new Set([...recipients(), ...(extraRecipient ? [extraRecipient] : [])])]
  if (!to.length)
    throw new HttpsError('failed-precondition', 'No recipients configured (ADMIN_EMAILS).')

  const csv = toCsv([
    ['Nachname', 'Vorname', 'Begleitung', 'Status', 'E-Mail', 'Telefon', 'Eingecheckt'],
    ...guests
      .slice()
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'de'),
      )
      .map((g) => [
        g.lastName,
        g.firstName,
        g.plusOnes,
        g.status === 'confirmed' ? 'bestätigt' : 'Warteliste',
        g.email,
        g.phone,
        g.checkedIn ? 'ja' : '',
      ]),
  ])
  const mail: MailDoc = {
    to,
    message: guestlistDigestMail({
      event,
      guests,
      csv,
      adminUrl: `${siteOrigin()}/admin/events/${eventId}/scan`,
    }),
  }
  await db.collection('mail').add({ ...mail, createdAt: FieldValue.serverTimestamp() })
  await eventRef.update({ 'guestlist.digestSentAt': FieldValue.serverTimestamp() })
  return guests.length
}

/**
 * Hourly: for published events with a guestlist that start within the next
 * GUESTLIST_DIGEST_HOURS (default 6) hours, mail the guest list once.
 */
export const guestlistDigestScheduled = onSchedule(
  { schedule: 'every 60 minutes', timeZone: 'Europe/Vienna' },
  async () => {
    const hours = Number(process.env.GUESTLIST_DIGEST_HOURS) || 6
    const now = Date.now()
    const soon = await getFirestore()
      .collection('events')
      .where('startsAt', '>', Timestamp.fromMillis(now))
      .where('startsAt', '<=', Timestamp.fromMillis(now + hours * 3600_000))
      .get()
    for (const d of soon.docs) {
      const e = d.data()
      if (e.status !== 'published' || !e.guestlist?.enabled || e.guestlist?.digestSentAt) continue
      try {
        const n = await sendDigest(d.id)
        logger.info('Guest list digest sent', { event: d.id, entries: n })
      } catch (err) {
        logger.error('Guest list digest failed', { event: d.id, err })
      }
    }
  },
)

/** Admin button "Send list by e-mail" (also to the admin's own address). */
export const sendGuestlistDigest = onCall({ memory: '256MiB' }, async (req) => {
  if (req.auth?.token.admin !== true) throw new HttpsError('permission-denied', 'Admins only.')
  const eventId = typeof req.data?.eventId === 'string' ? req.data.eventId : ''
  if (!eventId) throw new HttpsError('invalid-argument', 'eventId missing.')
  const entries = await sendDigest(eventId, req.auth.token.email)
  return { entries }
})
