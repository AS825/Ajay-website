import type { FeedPost } from '@ajay/shared'

const GRAPH = () => process.env.IG_GRAPH_URL ?? 'https://graph.instagram.com'

interface MediaResponse {
  data?: {
    id: string
    caption?: string
    media_type: FeedPost['mediaType']
    media_url?: string
    thumbnail_url?: string
    permalink: string
    timestamp: string
  }[]
  error?: { message: string }
}

/**
 * Latest posts via the official Instagram API (Instagram Login). Needs a
 * long-lived access token of Ajay's professional account (admin → Links → Feeds).
 */
export async function fetchInstagram(
  token: string,
  limit = 12,
): Promise<(Omit<FeedPost, 'imageUrl'> & { sourceUrl: string })[]> {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'
  const res = await fetch(
    `${GRAPH()}/me/media?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`,
    {
      signal: AbortSignal.timeout(15_000),
    },
  )
  const body = (await res.json().catch(() => ({}))) as MediaResponse
  if (!res.ok || body.error)
    throw new Error(`Instagram: ${body.error?.message ?? `HTTP ${res.status}`}`)
  return (body.data ?? [])
    .map((m) => ({
      id: m.id,
      caption: (m.caption ?? '').slice(0, 300),
      permalink: m.permalink,
      mediaType: m.media_type,
      timestamp: m.timestamp,
      // Videos/reels: use the cover image.
      sourceUrl: (m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url) ?? '',
    }))
    .filter((p) => p.sourceUrl && p.permalink)
}

/** Long-lived tokens last 60 days; refreshing returns a new one valid for another 60 days. */
export async function refreshInstagramToken(
  token: string,
): Promise<{ token: string; expiresAt: Date }> {
  const res = await fetch(
    `${GRAPH()}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`,
    {
      signal: AbortSignal.timeout(15_000),
    },
  )
  const body = (await res.json().catch(() => ({}))) as {
    access_token?: string
    expires_in?: number
    error?: { message: string }
  }
  if (!res.ok || !body.access_token)
    throw new Error(`Instagram token refresh: ${body.error?.message ?? `HTTP ${res.status}`}`)
  return {
    token: body.access_token,
    expiresAt: new Date(Date.now() + (body.expires_in ?? 60 * 86400) * 1000),
  }
}
