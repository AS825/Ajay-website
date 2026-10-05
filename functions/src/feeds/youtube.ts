import type { FeedVideo } from '@ajay/shared'

/** Overridable for tests (mock server); defaults to the public YouTube endpoints. */
const FEED_URL = () => process.env.YT_FEED_URL ?? 'https://www.youtube.com/feeds/videos.xml'
export const ytThumbUrl = (id: string) =>
  `${process.env.YT_THUMB_URL ?? 'https://i.ytimg.com/vi'}/${id}/hqdefault.jpg`

/** Channel ids from links like https://www.youtube.com/channel/UCxxxx (Links in the admin). */
export function channelIdsFromUrls(urls: string[]): string[] {
  const ids = urls
    .map((u) => u.match(/youtube\.com\/channel\/(UC[\w-]{20,})/)?.[1])
    .filter((x): x is string => !!x)
  return [...new Set(ids)]
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim()

/**
 * Parses a channel's public Atom feed (latest ~15 uploads, no API key needed).
 * Shorts are included by YouTube; they're filtered by the caller if wanted.
 */
export function parseYouTubeFeed(xml: string): Omit<FeedVideo, 'thumbUrl'>[] {
  const channelTitle = decode(xml.match(/<author>\s*<name>([\s\S]*?)<\/name>/)?.[1] ?? '')
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)]
    .map(([, e]) => ({
      id: e!.match(/<yt:videoId>([\w-]+)<\/yt:videoId>/)?.[1] ?? '',
      title: decode(e!.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? ''),
      publishedAt: e!.match(/<published>([^<]+)<\/published>/)?.[1] ?? '',
      channelTitle,
    }))
    .filter((v) => v.id && v.publishedAt)
}

export async function fetchChannel(channelId: string): Promise<Omit<FeedVideo, 'thumbUrl'>[]> {
  const res = await fetch(`${FEED_URL()}?channel_id=${encodeURIComponent(channelId)}`, {
    signal: AbortSignal.timeout(15_000),
  })
  if (!res.ok) throw new Error(`YouTube feed ${channelId}: HTTP ${res.status}`)
  return parseYouTubeFeed(await res.text())
}
