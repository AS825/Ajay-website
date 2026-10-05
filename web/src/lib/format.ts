import { EVENT_TIME_ZONE, type Lang } from '@ajay/shared'

const locale = (lang: Lang) => (lang === 'de' ? 'de-AT' : 'en-GB')

/** All event dates are shown in Europe/Vienna, regardless of the visitor's timezone. */
export function formatEventDate(date: Date, lang: Lang) {
  const fmt = (o: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale(lang), { timeZone: EVENT_TIME_ZONE, ...o }).format(date)
  return {
    day: fmt({ day: '2-digit' }),
    month: fmt({ month: 'short' }).replace('.', ''),
    weekday: fmt({ weekday: 'short' }).replace('.', ''),
    time: fmt({ hour: '2-digit', minute: '2-digit' }),
    date: fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    full: fmt({ dateStyle: 'full', timeStyle: 'short' }),
  }
}
