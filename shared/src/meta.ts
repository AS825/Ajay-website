import type { EventDoc } from './types'
import { localize } from './utils'

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** JSON for a <script> tag: `<` is escaped so the content can't close the tag. */
const jsonForScript = (v: unknown) => JSON.stringify(v).replace(/</g, '\\u003c')

/** schema.org MusicEvent (SPEC §13). */
export function musicEventJsonLd(e: EventDoc<Date>, url: string, performer: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: e.title,
    url,
    startDate: e.startsAt.toISOString(),
    endDate: e.endsAt.toISOString(),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    description: localize(e.description, 'en'),
    ...(e.flyerUrl ? { image: [e.flyerUrl] } : {}),
    location: { '@type': 'Place', name: e.venue.name, address: e.venue.address },
    performer: { '@type': 'MusicGroup', name: performer },
    ...(e.ticketing.externalUrl
      ? {
          offers: {
            '@type': 'Offer',
            url: e.ticketing.externalUrl,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
  }
}

/**
 * Injects per-event title, description, Open Graph / Twitter tags and JSON-LD
 * into the SPA's index.html (SPEC §13). Existing title/description/og tags are replaced.
 */
export function injectEventMeta(
  html: string,
  e: EventDoc<Date>,
  opts: { url: string; artistName: string; dateLabel: string },
): string {
  const title = `${e.title} — ${opts.dateLabel} · ${e.venue.name}`
  const description = localize(e.description, 'en').slice(0, 200)
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(opts.url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${esc(opts.artistName)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(opts.url)}" />`,
    ...(e.flyerUrl
      ? [
          `<meta property="og:image" content="${esc(e.flyerUrl)}" />`,
          `<meta name="twitter:image" content="${esc(e.flyerUrl)}" />`,
        ]
      : []),
    `<meta name="twitter:card" content="${e.flyerUrl ? 'summary_large_image' : 'summary'}" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<script type="application/ld+json">${jsonForScript(musicEventJsonLd(e, opts.url, opts.artistName))}</script>`,
  ].join('\n    ')

  const stripped = html
    .replace(/<title>[\s\S]*?<\/title>\s*/i, '')
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/i, '')
    .replace(/<meta\s+(property="og:[^"]+"|name="twitter:[^"]+")[^>]*>\s*/gi, '')
  return stripped.replace(/<\/head>/i, `    ${tags}\n  </head>`)
}
