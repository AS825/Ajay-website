import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MapPin } from 'lucide-react'
import { eventBadge, type EventView } from '../../lib/events'
import { formatEventDate } from '../../lib/format'
import { useLang } from '../../i18n'
import { Badge } from '../../components/ui/Badge'
import { MediaPlaceholder } from '../../components/ui/MediaPlaceholder'

export function EventCard({ event, className = '' }: { event: EventView; className?: string }) {
  const { t } = useTranslation()
  const { lang } = useLang()
  const date = formatEventDate(event.startsAt, lang)
  const badge = eventBadge(event)

  return (
    <Link
      to={`/events/${event.slug}`}
      className={`pressable group relative block overflow-hidden rounded-[var(--radius-card)] border border-hairline bg-surface shadow-soft ${className}`}
    >
      <div className="relative aspect-[4/5]">
        {event.flyerUrl ? (
          <img
            src={event.flyerUrl}
            alt={event.title}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition-transform duration-700 ease-[var(--ease-out-expo)] group-hover:scale-[1.04]"
          />
        ) : (
          <MediaPlaceholder label="TODO flyer" className="size-full" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        {badge && (
          <div className="absolute top-4 left-4">
            <Badge
              tone={
                badge === 'guestlistOpen' ? 'accent' : badge === 'tickets' ? 'neutral' : 'muted'
              }
            >
              {t(`events.badge.${badge}`)}
            </Badge>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 p-5">
          <div className="mb-3 flex items-end gap-3">
            <span className="text-7xl leading-[0.8] font-extrabold tracking-[-0.06em]">
              {date.day}
            </span>
            <span className="pb-1 text-sm leading-tight font-semibold tracking-widest uppercase">
              {date.month}
              <br />
              <span className="text-white/60">
                {date.weekday} · {date.time}
              </span>
            </span>
          </div>
          <h3 className="mb-1 text-2xl leading-tight font-bold tracking-tight">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-muted">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{event.venue.name}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}
