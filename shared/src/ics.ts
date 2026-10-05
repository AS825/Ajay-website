import type { EventDoc } from './types'

/** 20261015T200000Z */
function icsDate(d: Date): string {
  return d
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

function escapeText(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
}

/** RFC 5545 line folding: max 75 octets per line, continuation lines start with a space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out: string[] = []
  let current = ''
  let size = 0
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length
    if (size + n > (out.length ? 74 : 75)) {
      out.push(current)
      current = ''
      size = 0
    }
    current += ch
    size += n
  }
  out.push(current)
  return out.join('\r\n ')
}

/** iCalendar file for "Add to Calendar" (SPEC §6). Times are stored in UTC. */
export function buildIcs(
  e: Pick<EventDoc<Date>, 'slug' | 'title' | 'startsAt' | 'endsAt' | 'venue'> & {
    description: string
  },
  url: string,
  now: Date = new Date(),
): string {
  const location = [e.venue.name, e.venue.address].filter(Boolean).join(', ')
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AJAY ADAM//ajay.at//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.slug}@ajay.at`,
    `DTSTAMP:${icsDate(now)}`,
    `DTSTART:${icsDate(e.startsAt)}`,
    `DTEND:${icsDate(e.endsAt)}`,
    `SUMMARY:${escapeText(e.title)}`,
    `LOCATION:${escapeText(location)}`,
    `DESCRIPTION:${escapeText(`${e.description}\n\n${url}`)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** Google Calendar "add event" link as alternative to the .ics file. */
export function googleCalendarUrl(
  e: Pick<EventDoc<Date>, 'title' | 'startsAt' | 'endsAt' | 'venue'> & { description: string },
  url: string,
): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${icsDate(e.startsAt)}/${icsDate(e.endsAt)}`,
    details: `${e.description}\n\n${url}`,
    location: [e.venue.name, e.venue.address].filter(Boolean).join(', '),
  })
  return `https://calendar.google.com/calendar/render?${params}`
}
