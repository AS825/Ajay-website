/**
 * Integration tests for the callables against the Emulator Suite.
 * Run with `npm run test:functions` (starts the emulators itself).
 */
import { after, beforeEach, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { initializeApp as initAdmin } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp } from 'firebase/app'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'
import {
  connectAuthEmulator,
  getAuth as getClientAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { getAuth } from 'firebase-admin/auth'

const projectId = 'demo-ajay'
initAdmin({ projectId })
const db = getFirestore()
const client = initializeApp({ projectId, apiKey: 'demo' }, 'test-client')
const fns = getFunctions(client, 'europe-west1')
connectFunctionsEmulator(fns, '127.0.0.1', 5001)
const clientAuth = getClientAuth(client)
connectAuthEmulator(clientAuth, 'http://127.0.0.1:9099', { disableWarnings: true })

const DAY = 86_400_000
let n = 0

async function createEvent(
  over: Record<string, unknown> = {},
  guestlist: Record<string, unknown> = {},
) {
  const id = `test-${Date.now()}-${n++}`
  await db.doc(`events/${id}`).set({
    slug: id,
    title: `Test ${id}`,
    startsAt: Timestamp.fromMillis(Date.now() + 5 * DAY),
    endsAt: Timestamp.fromMillis(Date.now() + 5.25 * DAY),
    venue: { name: 'Club X', address: 'Wien', mapsUrl: '' },
    flyerUrl: '',
    description: { en: 'Test' },
    lineup: ['AJAY'],
    minAge: 18,
    status: 'published',
    guestlist: {
      enabled: true,
      capacity: 10,
      deadline: null,
      maxPlusOnes: 2,
      count: 0,
      ...guestlist,
    },
    ticketing: { enabled: false, externalUrl: '' },
    createdAt: Timestamp.now(),
    ...over,
  })
  return id
}

const guest = (eventId: string, over: Record<string, unknown> = {}) => ({
  eventId,
  firstName: 'Max',
  lastName: 'Muster',
  email: `max+${n++}@example.com`,
  phone: '',
  plusOnes: 0,
  privacyAccepted: true,
  newsletter: false,
  lang: 'en',
  website: '',
  ...over,
})

const join = httpsCallable<unknown, { status: string }>(fns, 'joinGuestlist')
const book = httpsCallable<unknown, { ok: boolean }>(fns, 'submitBooking')

async function reasonOf(p: Promise<unknown>): Promise<string> {
  try {
    await p
  } catch (err) {
    return (
      (err as { details?: { reason?: string } }).details?.reason ??
      `code:${(err as { code?: string }).code}`
    )
  }
  return 'no-error'
}

async function clearCollection(name: string) {
  const snap = await db.collection(name).get()
  await Promise.all(snap.docs.map((d) => d.ref.delete()))
}

beforeEach(async () => {
  await clearCollection('rateLimits')
})

after(async () => {
  await clearCollection('rateLimits')
})

describe('joinGuestlist', () => {
  test('confirms, counts the party and queues a mail', async () => {
    const id = await createEvent()
    const g = guest(id, { plusOnes: 2, email: 'Party@Example.com' })
    const res = await join(g)
    assert.equal(res.data.status, 'confirmed')
    const ev = (await db.doc(`events/${id}`).get()).data()!
    assert.equal(ev.guestlist.count, 3)
    const entries = await db.collection(`events/${id}/guestlist`).get()
    assert.equal(entries.size, 1)
    assert.equal(entries.docs[0]!.data().email, 'party@example.com')
    assert.equal(entries.docs[0]!.data().status, 'confirmed')
    const mails = await db.collection('mail').where('to', '==', 'party@example.com').get()
    assert.ok(
      mails.docs.some((m) => String(m.data().message.subject).includes("You're on the guestlist")),
    )
  })

  test('rejects duplicates (case-insensitive e-mail)', async () => {
    const id = await createEvent()
    await join(guest(id, { email: 'dup@example.com' }))
    assert.equal(await reasonOf(join(guest(id, { email: 'DUP@example.com' }))), 'duplicate')
  })

  test('waitlist when the party does not fit, count unchanged', async () => {
    const id = await createEvent({}, { capacity: 2 })
    assert.equal((await join(guest(id, { plusOnes: 1 }))).data.status, 'confirmed')
    assert.equal((await join(guest(id))).data.status, 'waitlist')
    assert.equal((await db.doc(`events/${id}`).get()).data()!.guestlist.count, 2)
  })

  test('closed after deadline, not found for drafts, plus-one limit', async () => {
    const late = await createEvent({}, { deadline: Timestamp.fromMillis(Date.now() - 1000) })
    assert.equal(await reasonOf(join(guest(late))), 'closed')
    const draft = await createEvent({ status: 'draft' })
    assert.equal(await reasonOf(join(guest(draft))), 'notFound')
    const id = await createEvent({}, { maxPlusOnes: 1 })
    assert.equal(await reasonOf(join(guest(id, { plusOnes: 2 }))), 'tooManyPlusOnes')
    const past = await createEvent({
      startsAt: Timestamp.fromMillis(Date.now() - 2 * DAY),
      endsAt: Timestamp.fromMillis(Date.now() - DAY),
    })
    assert.equal(await reasonOf(join(guest(past))), 'past')
  })

  test('invalid input and honeypot', async () => {
    const id = await createEvent()
    assert.equal(await reasonOf(join(guest(id, { privacyAccepted: false }))), 'invalid')
    assert.equal(await reasonOf(join(guest(id, { email: 'nope' }))), 'invalid')
    const res = await join(guest(id, { website: 'http://spam' }))
    assert.equal(res.data.status, 'confirmed')
    assert.equal((await db.collection(`events/${id}/guestlist`).get()).size, 0)
  })

  test('concurrent sign-ups never exceed capacity', async () => {
    const id = await createEvent({}, { capacity: 3, maxPlusOnes: 0 })
    const results = await Promise.all(Array.from({ length: 6 }, () => join(guest(id))))
    const confirmed = results.filter((r) => r.data.status === 'confirmed').length
    assert.equal(confirmed, 3)
    assert.equal((await db.doc(`events/${id}`).get()).data()!.guestlist.count, 3)
  })
})

describe('submitBooking', () => {
  const booking = (over: Record<string, unknown> = {}) => ({
    name: 'Promoter Pete',
    company: 'Club X',
    email: `pete+${n++}@example.com`,
    phone: '+43 660 1234567',
    eventType: 'club',
    date: '2026-12-31',
    location: 'Wien',
    setLength: '2h',
    expectedGuests: 300,
    budget: 'tbd',
    message: 'NYE <b>party</b>',
    privacyAccepted: true,
    website: '',
    lang: 'de',
    ...over,
  })

  test('stores the request and queues notification + receipt', async () => {
    const b = booking({ email: 'pete-mail@example.com' })
    assert.equal((await book(b)).data.ok, true)
    const saved = await db
      .collection('bookings')
      .where('email', '==', 'pete-mail@example.com')
      .get()
    assert.equal(saved.size, 1)
    assert.equal(saved.docs[0]!.data().status, 'new')
    assert.equal(saved.docs[0]!.data().privacyAccepted, undefined)
    const notification = await db
      .collection('mail')
      .where('replyTo', '==', 'pete-mail@example.com')
      .get()
    assert.equal(notification.size, 1)
    assert.equal(notification.docs[0]!.data().to, 'booking@ajay.at')
    // User input is escaped in the HTML.
    assert.ok(notification.docs[0]!.data().message.html.includes('NYE &lt;b&gt;party&lt;/b&gt;'))
    const receipt = await db.collection('mail').where('to', '==', 'pete-mail@example.com').get()
    assert.equal(receipt.size, 1)
    assert.match(receipt.docs[0]!.data().message.subject, /Booking-Anfrage/)
  })

  test('rate limit per e-mail', async () => {
    const email = 'spammy@example.com'
    for (let i = 0; i < 3; i++) await book(booking({ email }))
    assert.equal(await reasonOf(book(booking({ email }))), 'rateLimited')
  })

  test('honeypot and invalid input', async () => {
    assert.equal((await book(booking({ website: 'x', email: 'bot@example.com' }))).data.ok, true)
    assert.equal(
      (await db.collection('bookings').where('email', '==', 'bot@example.com').get()).size,
      0,
    )
    assert.equal(await reasonOf(book(booking({ eventType: 'rave' }))), 'invalid')
  })
})

describe('claimAdmin', () => {
  const claim = httpsCallable<unknown, { ok: boolean }>(fns, 'claimAdmin')
  async function user(email: string, emailVerified: boolean) {
    const auth = getAuth()
    const existing = await auth.getUserByEmail(email).catch(() => null)
    if (existing) await auth.deleteUser(existing.uid)
    return auth.createUser({ email, password: 'secret123', emailVerified })
  }

  test('allow-listed, verified e-mail gets the admin claim', async () => {
    const u = await user('claim-test@example.com', true)
    await signInWithEmailAndPassword(clientAuth, 'claim-test@example.com', 'secret123')
    assert.equal((await claim({})).data.ok, true)
    assert.equal((await getAuth().getUser(u.uid)).customClaims?.admin, true)
    await signOut(clientAuth)
  })

  test('unverified or unlisted e-mails are refused', async () => {
    await user('claim-test@example.com', false)
    await signInWithEmailAndPassword(clientAuth, 'claim-test@example.com', 'secret123')
    assert.equal(await reasonOf(claim({})), 'notAllowed')
    await signOut(clientAuth)
    await user('random@example.com', true)
    await signInWithEmailAndPassword(clientAuth, 'random@example.com', 'secret123')
    assert.equal(await reasonOf(claim({})), 'notAllowed')
    await signOut(clientAuth)
    assert.equal(await reasonOf(claim({})), 'code:functions/unauthenticated')
  })
})

describe('guest pass, promotion mail, guest list digest', () => {
  const getPass = httpsCallable<
    unknown,
    { firstName: string; status: string; event: { title: string } }
  >(fns, 'getGuestPass')
  const digest = httpsCallable<unknown, { entries: number }>(fns, 'sendGuestlistDigest')

  test('join returns a pass; QR mail; pass only with the right token', async () => {
    const id = await createEvent()
    const g = guest(id, { email: 'qr@example.com', firstName: 'Quinn' })
    const res = await join(g)
    const pass = (
      res.data as unknown as { pass: { eventId: string; entryId: string; token: string } }
    ).pass
    assert.equal(pass.eventId, id)
    assert.ok(pass.token.length >= 20)
    const entry = (await db.doc(`events/${id}/guestlist/${pass.entryId}`).get()).data()!
    assert.equal(entry.qrToken, pass.token)

    const mail = (
      await db.collection('mail').where('to', '==', 'qr@example.com').get()
    ).docs[0]!.data()
    assert.equal(mail.message.attachments[0].cid, 'guest-pass-qr')
    assert.equal(mail.message.attachments[0].contentType, 'image/png')
    assert.ok(mail.message.html.includes('cid:guest-pass-qr'))
    assert.ok(mail.message.html.includes(`/pass/${id}/${pass.entryId}?t=`))

    const view = await getPass(pass)
    assert.equal(view.data.firstName, 'Quinn')
    assert.equal(view.data.status, 'confirmed')
    assert.equal(await reasonOf(getPass({ ...pass, token: 'x'.repeat(24) })), 'notFound')
    assert.equal(await reasonOf(getPass({ ...pass, entryId: 'nope' })), 'notFound')
  })

  test('waitlist mail has no QR; promotion sends the QR mail', async () => {
    const id = await createEvent({}, { capacity: 1, maxPlusOnes: 0 })
    await join(guest(id))
    const res = await join(guest(id, { email: 'later@example.com' }))
    assert.equal(res.data.status, 'waitlist')
    const first = (await db.collection('mail').where('to', '==', 'later@example.com').get()).docs
    assert.equal(first.length, 1)
    assert.equal(first[0]!.data().message.attachments, undefined)

    const entryId = (res.data as unknown as { pass: { entryId: string } }).pass.entryId
    const promote = httpsCallable<unknown, { ok: boolean; mailed: boolean }>(fns, 'promoteGuest')
    assert.equal(
      await reasonOf(promote({ eventId: id, entryId })),
      'code:functions/permission-denied',
    )
    const auth = getAuth()
    const u =
      (await auth.getUserByEmail('door@example.com').catch(() => null)) ??
      (await auth.createUser({
        email: 'door@example.com',
        password: 'secret123',
        emailVerified: true,
      }))
    await auth.setCustomUserClaims(u.uid, { admin: true })
    await signInWithEmailAndPassword(clientAuth, 'door@example.com', 'secret123')
    assert.equal(await reasonOf(promote({ eventId: id, entryId })), 'overCapacity')
    assert.equal((await promote({ eventId: id, entryId, force: true })).data.mailed, true)
    assert.equal(await reasonOf(promote({ eventId: id, entryId, force: true })), 'notWaitlist')
    await signOut(clientAuth)
    assert.equal((await db.doc(`events/${id}`).get()).data()!.guestlist.count, 2)
    const mails = (await db.collection('mail').where('to', '==', 'later@example.com').get()).docs
    assert.equal(mails.length, 2)
    const promoted = mails.map((m) => m.data()).find((m) => m.message.attachments)
    assert.match(promoted!.message.subject, /guestlist/)
  })

  test('guest list digest: admins only, mails list + CSV', async () => {
    const id = await createEvent()
    await join(guest(id, { firstName: 'Zoe', lastName: 'Zander' }))
    await join(guest(id, { firstName: 'Adam', lastName: 'Ahorn', plusOnes: 1 }))
    assert.equal(await reasonOf(digest({ eventId: id })), 'code:functions/permission-denied')

    const auth = getAuth()
    const existing = await auth.getUserByEmail('door@example.com').catch(() => null)
    const u =
      existing ??
      (await auth.createUser({
        email: 'door@example.com',
        password: 'secret123',
        emailVerified: true,
      }))
    await auth.setCustomUserClaims(u.uid, { admin: true })
    await signInWithEmailAndPassword(clientAuth, 'door@example.com', 'secret123')
    assert.equal((await digest({ eventId: id })).data.entries, 2)
    await signOut(clientAuth)

    const mail = (
      await db.collection('mail').where('message.subject', '>=', 'Gästeliste').get()
    ).docs
      .map((d) => d.data())
      .find((m) => (m.to as string[]).includes('door@example.com'))!
    assert.ok(
      ((m) => m.indexOf('Ahorn') < m.indexOf('Zander'))(mail.message.html),
      'sorted by last name',
    )
    const csv = Buffer.from(mail.message.attachments[0].content, 'base64').toString('utf8')
    assert.ok(csv.includes('Ahorn,Adam,1,bestätigt'))
    assert.ok((await db.doc(`events/${id}`).get()).data()!.guestlist.digestSentAt)
  })
})
