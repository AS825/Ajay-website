import type { Timestamp } from 'firebase/firestore'
import { EVENT_TIME_ZONE, type Lang } from '@ajay/shared'

export function fmtDateTime(
  ts: Timestamp | Date | null | undefined,
  lang: Lang,
  withTime = true,
): string {
  if (!ts) return '–'
  const d = ts instanceof Date ? ts : ts.toDate()
  return new Intl.DateTimeFormat(lang === 'de' ? 'de-AT' : 'en-GB', {
    timeZone: EVENT_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(d)
}
