import { EVENT_TIME_ZONE, type Lang } from '@ajay/shared'

const locale = (lang: Lang) => (lang === 'de' ? 'de-AT' : 'en-GB')

export function formatEventDate(date: Date, lang: Lang) {
  const tz = { timeZone: EVENT_TIME_ZONE }
  return {
    day: new Intl.DateTimeFormat(locale(lang), { ...tz, day: '2-digit' }).format(date),
    month: new Intl.DateTimeFormat(locale(lang), { ...tz, month: 'short' })
      .format(date)
      .replace('.', ''),
    weekday: new Intl.DateTimeFormat(locale(lang), { ...tz, weekday: 'short' })
      .format(date)
      .replace('.', ''),
    time: new Intl.DateTimeFormat(locale(lang), {
      ...tz,
      hour: '2-digit',
      minute: '2-digit',
    }).format(date),
    full: new Intl.DateTimeFormat(locale(lang), {
      ...tz,
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(date),
  }
}
