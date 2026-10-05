import { onCall } from 'firebase-functions/v2/https'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { bookingRequestSchema, seedSite } from '@ajay/shared'
import { callableOptions } from '../lib/env'
import { clientIp, enforceRateLimit } from '../lib/rateLimit'
import { parseOrThrow } from '../lib/validate'
import { bookingNotificationMail, bookingReceiptMail, type MailDoc } from '../mail/templates'

/**
 * Booking request (SPEC §9): stores `bookings/{id}` (status "new"), notifies
 * the booking inbox (Reply-To = requester) and sends a receipt. Honeypot +
 * App Check + rate limits against spam.
 */
export const submitBooking = onCall(callableOptions, async (req): Promise<{ ok: true }> => {
  const { lang, website, privacyAccepted, ...booking } = parseOrThrow(
    bookingRequestSchema,
    req.data,
  )
  if (website) return { ok: true }

  const email = booking.email.trim().toLowerCase()
  await enforceRateLimit('booking_ip', clientIp(req), 5, 60 * 60_000)
  await enforceRateLimit('booking_email', email, 3, 24 * 60 * 60_000)

  const db = getFirestore()
  const site = (await db.doc('settings/site').get()).data() as { bookingEmail?: string } | undefined
  const inbox = site?.bookingEmail || seedSite.bookingEmail
  const data = { ...booking, email, company: booking.company ?? '', message: booking.message ?? '' }

  const batch = db.batch()
  batch.set(db.collection('bookings').doc(), {
    ...data,
    lang,
    status: 'new',
    notes: '',
    privacyAcceptedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  })
  const notification: MailDoc = {
    to: inbox,
    replyTo: email,
    message: bookingNotificationMail(data),
  }
  const receipt: MailDoc = { to: email, replyTo: inbox, message: bookingReceiptMail(data, lang) }
  for (const mail of [notification, receipt]) {
    batch.set(db.collection('mail').doc(), { ...mail, createdAt: FieldValue.serverTimestamp() })
  }
  await batch.commit()
  return { ok: true }
})
