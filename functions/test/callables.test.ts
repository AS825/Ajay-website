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

const projectId = 'demo-ajay'
initAdmin({ projectId })
const db = getFirestore()
const client = initializeApp({ projectId, apiKey: 'demo' }, 'test-client')
const fns = getFunctions(client, 'europe-west1')
connectFunctionsEmulator(fns, '127.0.0.1', 5001)

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
