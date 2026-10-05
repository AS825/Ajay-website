/**
 * Feed sync against a local mock of YouTube RSS + Instagram API.
 * Run with `npm run test:feeds` (emulator project demo-ajay-feeds, see functions/.env.demo-ajay-feeds).
 */
import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type Server } from 'node:http'
import { initializeApp as initAdmin } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth as getClientAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions'
import { PNG, ytFeed } from './fixtures'

const projectId = 'demo-ajay-feeds'
initAdmin({ projectId })
const db = getFirestore()
const client = initializeApp({ projectId, apiKey: 'demo' }, 'feeds-client')
const clientAuth = getClientAuth(client)
connectAuthEmulator(clientAuth, 'http://127.0.0.1:9099', { disableWarnings: true })
const fns = getFunctions(client, 'europe-west1')
connectFunctionsEmulator(fns, '127.0.0.1', 5001)
const sync = httpsCallable<
  unknown,
  { youtube: { videos: number; error: string }; instagram: { posts: number; error: string } }
>(fns, 'syncFeeds')

const CH1 = 'UCbarwFBxhndGVWTjlznesKg'
const CH2 = 'UCga2Gfg9z_rMUor-uY7Vsog'
const requests: string[] = []
let server: Server

before(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x')
    requests.push(url.pathname + url.search)
    if (url.pathname === '/yt') {
      const ch = url.searchParams.get('channel_id')
      res.setHeader('content-type', 'application/atom+xml')
      if (ch === CH1)
        return res.end(
          ytFeed('AJAY', [
            { id: 'newestVid01', title: 'Newest', published: '2026-10-04T10:00:00+00:00' },
            { id: 'olderVid001', title: 'Older', published: '2026-08-01T10:00:00+00:00' },
          ]),
        )
      if (ch === CH2)
        return res.end(
          ytFeed('AJAY Edits', [
            {
              id: 'middleVid01',
              title: 'Middle &amp; more',
              published: '2026-09-15T10:00:00+00:00',
            },
          ]),
        )
      res.statusCode = 404
      return res.end()
    }
    if (url.pathname.startsWith('/vi/') || url.pathname.startsWith('/img/')) {
      res.setHeader('content-type', 'image/png')
      return res.end(PNG)
    }
    if (url.pathname === '/ig/me/media') {
      res.setHeader('content-type', 'application/json')
      if (url.searchParams.get('access_token') !== 'NEW_TOKEN_0123456789') {
        res.statusCode = 400
        return res.end(JSON.stringify({ error: { message: 'Invalid OAuth access token' } }))
      }
      return res.end(
        JSON.stringify({
          data: [
            {
              id: '1',
              caption: 'Club night',
              media_type: 'IMAGE',
              media_url: 'http://127.0.0.1:9876/img/1.png',
              permalink: 'https://www.instagram.com/p/1/',
              timestamp: '2026-10-03T22:00:00+0000',
            },
            {
              id: '2',
              media_type: 'VIDEO',
              media_url: 'http://127.0.0.1:9876/video.mp4',
              thumbnail_url: 'http://127.0.0.1:9876/img/2.png',
              permalink: 'https://www.instagram.com/reel/2/',
              timestamp: '2026-10-02T22:00:00+0000',
            },
          ],
        }),
      )
    }
    if (url.pathname === '/ig/refresh_access_token') {
      res.setHeader('content-type', 'application/json')
      return res.end(
        JSON.stringify({
          access_token: 'NEW_TOKEN_0123456789',
          token_type: 'bearer',
          expires_in: 5184000,
        }),
      )
    }
    res.statusCode = 404
    res.end()
  })
  await new Promise<void>((r) => server.listen(9876, '127.0.0.1', r))

  await db.doc('links/yt1').set({
    title: 'YouTube',
    url: `https://www.youtube.com/channel/${CH1}`,
    category: 'social',
    icon: 'youtube',
    order: 1,
    visible: true,
  })
  await db.doc('links/yt2').set({
    title: 'YouTube',
    url: `https://www.youtube.com/channel/${CH2}`,
    category: 'social',
    icon: 'youtube',
    order: 2,
    visible: false,
  })
  // Expires in 5 days → the sync must refresh it first.
  await db.doc('secrets/instagram').set({
    accessToken: 'OLD_TOKEN_0123456789',
    expiresAt: Timestamp.fromMillis(Date.now() + 5 * 86_400_000),
  })

  const auth = getAuth()
  for (const [email, admin] of [
    ['admin@feeds.test', true],
    ['fan@feeds.test', false],
  ] as const) {
    const u = await auth
      .createUser({ email, password: 'secret123' })
      .catch(() => auth.getUserByEmail(email))
    await auth.setCustomUserClaims(u.uid, admin ? { admin: true } : {})
  }
})

after(async () => {
  await signOut(clientAuth)
  server?.close()
})

test('non-admins cannot trigger a sync', async () => {
  await signInWithEmailAndPassword(clientAuth, 'fan@feeds.test', 'secret123')
  await assert.rejects(
    sync({}),
    (err: { code?: string }) => err.code === 'functions/permission-denied',
  )
  await signOut(clientAuth)
})

test('admin sync pulls YouTube + Instagram, stores images, refreshes the token', async () => {
  await signInWithEmailAndPassword(clientAuth, 'admin@feeds.test', 'secret123')
  const res = await sync({})
  assert.equal(res.data.youtube.error, '')
  assert.equal(res.data.youtube.videos, 3)
  assert.equal(res.data.instagram.error, '')
  assert.equal(res.data.instagram.posts, 2)

  const yt = (await db.doc('feeds/youtube').get()).data()!
  assert.deepEqual(
    yt.items.map((v: { id: string }) => v.id),
    ['newestVid01', 'middleVid01', 'olderVid001'],
  )
  assert.equal(yt.items[1].title, 'Middle & more')
  assert.match(yt.items[0].thumbUrl, /media%2Fimages%2Ffeeds%2Fyoutube%2FnewestVid01\.jpg/)

  const ig = (await db.doc('feeds/instagram').get()).data()!
  assert.equal(ig.items.length, 2)
  assert.equal(ig.items[1].mediaType, 'VIDEO')
  assert.equal(ig.items[1].permalink, 'https://www.instagram.com/reel/2/')
  assert.match(ig.items[0].imageUrl, /feeds%2Finstagram%2F1\.jpg/)
  // The reel's cover (thumbnail_url) was copied, not the video file.
  assert.ok(requests.includes('/img/2.png'))
  assert.ok(!requests.includes('/video.mp4'))

  const secret = (await db.doc('secrets/instagram').get()).data()!
  assert.equal(secret.accessToken, 'NEW_TOKEN_0123456789')
  assert.ok(secret.expiresAt.toMillis() > Date.now() + 50 * 86_400_000)

  // Second sync: thumbnails already stored → not downloaded again.
  const thumbHits = requests.filter((r) => r.startsWith('/vi/')).length
  await sync({})
  assert.equal(requests.filter((r) => r.startsWith('/vi/')).length, thumbHits)
})

test('a failing Instagram token keeps the last posts and reports the error', async () => {
  await db.doc('secrets/instagram').set({
    accessToken: 'BROKEN_TOKEN_0123456789',
    expiresAt: Timestamp.fromMillis(Date.now() + 40 * 86_400_000),
  })
  const res = await sync({})
  assert.match(res.data.instagram.error, /Invalid OAuth/)
  const ig = (await db.doc('feeds/instagram').get()).data()!
  assert.equal(ig.items.length, 2)
  assert.match(ig.error, /Invalid OAuth/)
})
