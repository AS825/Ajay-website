/**
 * Security rules tests (SPEC §12). Run with `npm run test:rules`
 * (starts the Firestore + Storage emulators itself).
 */
import { after, before, beforeEach, describe, test } from 'node:test'
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { ref, uploadBytes, getBytes } from 'firebase/storage'

let env: RulesTestEnvironment

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-ajay-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  })
})
after(async () => env?.cleanup())

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'settings/site'), { artistName: 'AJAY ADAM' })
    await setDoc(doc(db, 'settings/secret'), { x: 1 })
    await setDoc(doc(db, 'links/visible'), { visible: true, title: 'IG' })
    await setDoc(doc(db, 'links/hidden'), { visible: false, title: 'WIP' })
    await setDoc(doc(db, 'events/pub'), { status: 'published', slug: 'pub' })
    await setDoc(doc(db, 'events/draft'), { status: 'draft', slug: 'draft' })
    await setDoc(doc(db, 'events/pub/guestlist/g1'), { email: 'a@b.c' })
    await setDoc(doc(db, 'bookings/b1'), { name: 'x' })
    await setDoc(doc(db, 'mail/m1'), { to: 'x' })
    await setDoc(doc(db, 'rateLimits/r1'), { count: 1 })
    await setDoc(doc(db, 'feeds/youtube'), { items: [] })
    await setDoc(doc(db, 'secrets/instagram'), { accessToken: 'secret' })
  })
})

const visitor = () => env.unauthenticatedContext().firestore()
const user = () => env.authenticatedContext('fan', { email: 'fan@example.com' }).firestore()
const admin = () => env.authenticatedContext('ajay', { admin: true }).firestore()

describe('firestore: public', () => {
  test('reads public content', async () => {
    await assertSucceeds(getDoc(doc(visitor(), 'settings/site')))
    await assertSucceeds(getDoc(doc(visitor(), 'links/visible')))
    await assertSucceeds(getDoc(doc(visitor(), 'events/pub')))
    await assertSucceeds(getDoc(doc(visitor(), 'feeds/youtube')))
    await assertSucceeds(
      getDocs(query(collection(visitor(), 'links'), where('visible', '==', true))),
    )
    await assertSucceeds(
      getDocs(query(collection(visitor(), 'events'), where('status', '==', 'published'))),
    )
  })

  test('cannot read private content', async () => {
    for (const path of [
      'settings/secret',
      'links/hidden',
      'events/draft',
      'events/pub/guestlist/g1',
      'bookings/b1',
      'mail/m1',
      'rateLimits/r1',
      'secrets/instagram',
    ]) {
      await assertFails(getDoc(doc(visitor(), path)))
      await assertFails(getDoc(doc(user(), path)))
    }
    await assertFails(getDocs(collection(visitor(), 'links')))
    await assertFails(getDocs(collection(visitor(), 'events')))
  })

  test('cannot write anything (also when signed in without admin claim)', async () => {
    for (const db of [visitor(), user()]) {
      await assertFails(setDoc(doc(db, 'settings/theme'), { accentColor: '#000' }))
      await assertFails(setDoc(doc(db, 'events/pub/guestlist/me'), { email: 'me@x.y' }))
      await assertFails(setDoc(doc(db, 'bookings/new'), { name: 'spam' }))
      await assertFails(setDoc(doc(db, 'mail/new'), { to: 'victim@x.y' }))
      await assertFails(setDoc(doc(db, 'feeds/youtube'), { items: ['spam'] }))
      await assertFails(deleteDoc(doc(db, 'events/pub')))
    }
  })
})

describe('firestore: admin', () => {
  test('reads and writes everything', async () => {
    const db = admin()
    for (const path of [
      'settings/secret',
      'links/hidden',
      'events/draft',
      'events/pub/guestlist/g1',
      'bookings/b1',
      'mail/m1',
    ]) {
      await assertSucceeds(getDoc(doc(db, path)))
    }
    await assertSucceeds(setDoc(doc(db, 'settings/theme'), { accentColor: '#00ff00' }))
    await assertSucceeds(setDoc(doc(db, 'events/new'), { status: 'draft' }))
    await assertSucceeds(deleteDoc(doc(db, 'events/pub/guestlist/g1')))
  })
})

describe('storage', () => {
  const png = new Uint8Array([137, 80, 78, 71])
  const storageOf = (ctx: ReturnType<RulesTestEnvironment['authenticatedContext']>) => ctx.storage()

  test('admin uploads within type/size limits only', async () => {
    const s = storageOf(env.authenticatedContext('ajay', { admin: true }))
    await assertSucceeds(
      uploadBytes(ref(s, 'media/images/a.png'), png, { contentType: 'image/png' }),
    )
    await assertSucceeds(
      uploadBytes(ref(s, 'media/docs/press.pdf'), png, { contentType: 'application/pdf' }),
    )
    await assertFails(
      uploadBytes(ref(s, 'media/images/a.exe'), png, { contentType: 'application/x-msdownload' }),
    )
    await assertFails(uploadBytes(ref(s, 'media/docs/x.png'), png, { contentType: 'image/png' }))
    await assertFails(uploadBytes(ref(s, 'other/a.png'), png, { contentType: 'image/png' }))
    const big = new Uint8Array(11 * 1024 * 1024)
    await assertFails(
      uploadBytes(ref(s, 'media/images/big.png'), big, { contentType: 'image/png' }),
    )
  })

  test('visitors read media but cannot upload', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await uploadBytes(ref(ctx.storage(), 'media/images/pub.png'), png, {
        contentType: 'image/png',
      })
    })
    const s = env.unauthenticatedContext().storage()
    await assertSucceeds(getBytes(ref(s, 'media/images/pub.png')))
    await assertFails(uploadBytes(ref(s, 'media/images/x.png'), png, { contentType: 'image/png' }))
    const u = env.authenticatedContext('fan').storage()
    await assertFails(uploadBytes(ref(u, 'media/images/x.png'), png, { contentType: 'image/png' }))
  })
})
