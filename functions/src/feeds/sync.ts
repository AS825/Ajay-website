import { logger } from 'firebase-functions'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import type { FeedDoc, FeedPost, FeedVideo, LinkDoc } from '@ajay/shared'
import { channelIdsFromUrls, fetchChannel, ytThumbUrl } from './youtube'
import { fetchInstagram, refreshInstagramToken } from './instagram'
import { storeRemoteImage } from './storeImage'

const MAX_VIDEOS = 12
const MAX_POSTS = 9
const REFRESH_BEFORE_MS = 10 * 86_400_000

export interface SyncSummary {
  youtube: { channels: number; videos: number; error: string }
  instagram: { connected: boolean; posts: number; error: string }
}

const message = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 300)

async function syncYouTube(): Promise<SyncSummary['youtube']> {
  const db = getFirestore()
  const ref = db.doc('feeds/youtube')
  // Channels come from the YouTube links managed in the admin (also hidden ones).
  const links = await db.collection('links').where('icon', '==', 'youtube').get()
  const channels = channelIdsFromUrls(links.docs.map((d) => (d.data() as LinkDoc).url))
  if (!channels.length) {
    await ref.set({
      items: [],
      updatedAt: new Date().toISOString(),
      error: 'No YouTube channel links found.',
    } satisfies FeedDoc<FeedVideo>)
    return { channels: 0, videos: 0, error: 'No YouTube channel links found.' }
  }

  const errors: string[] = []
  const results = await Promise.all(
    channels.map((c) =>
      fetchChannel(c).catch((err) => {
        errors.push(message(err))
        return []
      }),
    ),
  )
  const latest = results
    .flat()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, MAX_VIDEOS)

  // If every channel failed, keep the previous items instead of emptying the section.
  if (!latest.length && errors.length) {
    await ref.set(
      { error: errors.join(' · '), updatedAt: new Date().toISOString() },
      { merge: true },
    )
    return { channels: channels.length, videos: 0, error: errors.join(' · ') }
  }

  const items: FeedVideo[] = []
  for (const v of latest) {
    try {
      items.push({
        ...v,
        thumbUrl: await storeRemoteImage(ytThumbUrl(v.id), `youtube/${v.id}.jpg`),
      })
    } catch (err) {
      errors.push(message(err))
    }
  }
  await ref.set({
    items,
    updatedAt: new Date().toISOString(),
    error: errors.join(' · '),
  } satisfies FeedDoc<FeedVideo>)
  return { channels: channels.length, videos: items.length, error: errors.join(' · ') }
}

async function syncInstagram(): Promise<SyncSummary['instagram']> {
  const db = getFirestore()
  const ref = db.doc('feeds/instagram')
  // Admin-only document (Firestore rules): the token never reaches visitors.
  const secretRef = db.doc('secrets/instagram')
  const secret = (await secretRef.get()).data() as
    { accessToken?: string; expiresAt?: Timestamp } | undefined
  if (!secret?.accessToken) return { connected: false, posts: 0, error: '' }

  try {
    let token = secret.accessToken
    const expires = secret.expiresAt?.toMillis() ?? 0
    if (expires && expires - Date.now() < REFRESH_BEFORE_MS) {
      const refreshed = await refreshInstagramToken(token)
      token = refreshed.token
      await secretRef.set(
        { accessToken: token, expiresAt: Timestamp.fromDate(refreshed.expiresAt) },
        { merge: true },
      )
      logger.info('Instagram token refreshed')
    }

    const media = (await fetchInstagram(token)).slice(0, MAX_POSTS)
    const items: FeedPost[] = []
    const errors: string[] = []
    for (const { sourceUrl, ...p } of media) {
      try {
        items.push({ ...p, imageUrl: await storeRemoteImage(sourceUrl, `instagram/${p.id}.jpg`) })
      } catch (err) {
        errors.push(message(err))
      }
    }
    await ref.set({
      items,
      updatedAt: new Date().toISOString(),
      error: errors.join(' · '),
    } satisfies FeedDoc<FeedPost>)
    return { connected: true, posts: items.length, error: errors.join(' · ') }
  } catch (err) {
    // Keep the last posts on the site; only record the error for the admin.
    await ref.set({ error: message(err), updatedAt: new Date().toISOString() }, { merge: true })
    return { connected: true, posts: 0, error: message(err) }
  }
}

/** Pulls the latest YouTube uploads and Instagram posts into Firestore (`feeds/*`). */
export async function runFeedSync(): Promise<SyncSummary> {
  const [youtube, instagram] = await Promise.all([syncYouTube(), syncInstagram()])
  logger.info('Feed sync', { youtube, instagram })
  return { youtube, instagram }
}
