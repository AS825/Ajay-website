import { useTranslation } from 'react-i18next'
import { countdownTo, useNow } from '../../lib/hooks'

const pad = (n: number) => String(n).padStart(2, '0')

/** Big countdown to the event start (SPEC §6). */
export function Countdown({ startsAt, endsAt }: { startsAt: Date; endsAt: Date }) {
  const { t } = useTranslation()
  const now = useNow()
  if (endsAt <= now) return null
  const c = countdownTo(startsAt, now)

  if (c.done) {
    return (
      <p className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-bold">
        <span className="size-2 animate-pulse rounded-full bg-white" aria-hidden="true" />
        {t('events.detail.liveNow')}
      </p>
    )
  }

  const units = [
    { v: c.days, l: t('events.detail.days') },
    { v: c.hours, l: t('events.detail.hours') },
    { v: c.minutes, l: t('events.detail.minutes') },
    { v: c.seconds, l: t('events.detail.seconds') },
  ]
  return (
    <div>
      <p className="eyebrow mb-3">{t('events.detail.startsIn')}</p>
      <div
        className="grid grid-cols-4 gap-2"
        role="timer"
        aria-label={`${t('events.detail.startsIn')} ${c.days} ${units[0]!.l}, ${c.hours} ${units[1]!.l}, ${c.minutes} ${units[2]!.l}`}
      >
        {units.map((u) => (
          <div
            key={u.l}
            className="rounded-[18px] border border-hairline bg-white/[0.04] py-3 text-center"
            aria-hidden="true"
          >
            <span className="block text-3xl font-extrabold tracking-tight tabular-nums md:text-4xl">
              {pad(u.v)}
            </span>
            <span className="mt-1 block text-[10px] font-semibold tracking-[0.16em] text-white/50 uppercase">
              {u.l}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
