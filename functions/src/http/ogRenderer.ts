import { onRequest } from 'firebase-functions/v2/https'
import { logger } from 'firebase-functions'
import { getFirestore, type Timestamp } from 'firebase-admin/firestore'
import { isEmulator } from '../lib/env'
import { EVENT_TIME_ZONE, injectEventMeta, seedSite, type EventDoc } from '@ajay/shared'

/**
 * Serves index.html with per-event Open Graph / Twitter / JSON-LD tags for
 * /events/:slug (SPEC §13), so shared links show the flyer in WhatsApp,
 * Instagram, iMessage etc. The SPA then takes over in the browser.
 *
 * Hosting rewrites /events/* here. index.html is fetched from Hosting itself
 * (same origin) and cached in memory.
 */

let shellCache: { html: string; at: number } | null = null
const SHELL_TTL_MS = 5 * 60 * 1000

/** Origin the request came in on (custom domain or *.web.app). */
function requestOrigin(req: {
  headers: Record<string, string | string[] | undefined>
  protocol: string
}) {
  const header = (name: string) => {
    const v = req.headers[name]
    return (Array.isArray(v) ? v[0] : v)?.split(',')[0]?.trim()
  }
  const host = header('x-forwarded-host') ?? header('host')
  const proto = header('x-forwarded-proto') ?? req.protocol
  return `${proto}://${host}`
}

/** Where index.html is fetched from: the Hosting emulator locally, else the request origin. */
const shellOrigin = (req: Parameters<typeof requestOrigin>[0]) =>
  isEmulator ? 'http://127.0.0.1:5000' : requestOrigin(req)

/** Canonical / og:url origin: SITE_ORIGIN (e.g. https://ajay.at) in production. */
const canonicalOrigin = (req: Parameters<typeof requestOrigin>[0]) =>
  isEmulator ? 'http://localhost:5000' : (process.env.SITE_ORIGIN ?? requestOrigin(req))

async function loadShell(origin: string): Promise<string> {
  if (shellCache && Date.now() - shellCache.at < SHELL_TTL_MS) return shellCache.html
  const res = await fetch(`${origin}/index.html`)
  if (!res.ok) throw new Error(`index.html fetch failed: ${res.status}`)
  const html = await res.text()
  shellCache = { html, at: Date.now() }
  return html
}

function toDates(d: EventDoc<Timestamp>): EventDoc<Date> {
  return {
    ...d,
    startsAt: d.startsAt.toDate(),
    endsAt: d.endsAt.toDate(),
    createdAt: d.createdAt.toDate(),
    guestlist: { ...d.guestlist, deadline: d.guestlist.deadline?.toDate() ?? null },
  }
}

export const ogRenderer = onRequest({ memory: '256MiB', concurrency: 40 }, async (req, res) => {
  let shell: string
  try {
    shell = await loadShell(shellOrigin(req))
  } catch (err) {
    logger.error('Could not load index.html', err)
    res.status(502).send('Temporarily unavailable')
    return
  }

  const slug = decodeURIComponent(req.path.replace(/^\/events\//, '').replace(/\/$/, ''))
  const snap = slug
    ? await getFirestore()
        .collection('events')
        .where('slug', '==', slug)
        .where('status', '==', 'published')
        .limit(1)
        .get()
    : null
  const doc = snap?.docs[0]

  res.set('Content-Type', 'text/html; charset=utf-8')
  if (!doc) {
    // Unknown slug: the SPA renders its 404 page.
    res.set('Cache-Control', 'public, max-age=60')
    res.status(404).send(shell)
    return
  }

  const event = toDates(doc.data() as EventDoc<Timestamp>)
  const site = (await getFirestore().doc('settings/site').get()).data() as
    { artistName?: string } | undefined
  const dateLabel = new Intl.DateTimeFormat('en-GB', {
    timeZone: EVENT_TIME_ZONE,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(event.startsAt)

  const html = injectEventMeta(shell, event, {
    url: `${canonicalOrigin(req)}/events/${encodeURIComponent(event.slug)}`,
    artistName: site?.artistName ?? seedSite.artistName,
    dateLabel,
  })
  // Short browser cache, longer CDN cache: edits in the admin show up within minutes.
  res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
  res.status(200).send(html)
})
