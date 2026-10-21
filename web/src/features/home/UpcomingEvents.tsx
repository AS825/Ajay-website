import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Reveal } from '../../components/motion/Reveal'
import { Container, Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'
import { eventBadge, isUpcoming } from '../../lib/events'
import { formatEventDate } from '../../lib/format'
import { useLang } from '../../i18n'

/** Press-kit "Events": upcoming dates as a quiet list, then the LECTION series. */
export function UpcomingEvents() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { events, ready, site } = useSiteData()
  const upcoming = events.filter((e) => isUpcoming(e)).slice(0, 6)
  const lection = site.lectionUrl.trim()

  return (
    <Section id="events" title={t('events.title')} align="center">
      <Container>
        {!ready ? (
          <div className="mx-auto h-40 max-w-3xl animate-pulse bg-surface" aria-busy="true" />
        ) : upcoming.length > 0 ? (
          <ul className="mx-auto max-w-3xl border-t border-hairline">
            {upcoming.map((e, i) => {
              const d = formatEventDate(e.startsAt, lang)
              const badge = eventBadge(e)
              return (
                <li key={e.id} className="border-b border-hairline">
                  <Reveal delay={Math.min(i, 4) * 0.06}>
                    <Link
                      to={`/events/${e.slug}`}
                      className="group grid grid-cols-[4.5rem_1fr_auto] items-center gap-4 py-5 md:grid-cols-[6rem_1fr_auto]"
                    >
                      <span className="leading-none uppercase">
                        <span className="block text-3xl md:text-4xl">{d.day}</span>
                        <span className="text-sm">
                          {d.month} · {d.weekday}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xl uppercase md:text-2xl">
                          {e.title}
                        </span>
                        <span className="block truncate text-sm text-muted">
                          {e.venue.name} · {d.time}
                          {badge === 'guestlistOpen' && ` · ${t('events.badge.guestlistOpen')}`}
                        </span>
                      </span>
                      <ArrowRight
                        className="size-5 transition-transform duration-500 group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </Link>
                  </Reveal>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="text-center text-muted">{t('events.empty')}</p>
        )}
        <p className="mt-6 text-center">
          <Link to="/events" className="text-sm uppercase underline-offset-4 hover:underline">
            {t('events.all')}
          </Link>
        </p>

        {/^https?:\/\//.test(lection) && (
          <Reveal className="mt-20 text-center md:mt-28">
            <a
              href={lection}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-block"
            >
              <span className="block text-lg uppercase md:text-2xl">{t('lection.more')}</span>
              <span className="font-wide block text-[14vw] leading-[0.95] md:text-[9vw] xl:text-[8.5rem]">
                LECTION
              </span>
              <span className="mx-auto mt-3 block h-px w-0 bg-current transition-[width] duration-700 ease-[var(--ease-out-expo)] group-hover:w-full" />
            </a>
            <p className="mt-3 text-sm uppercase">{t('lection.tagline')}</p>
          </Reveal>
        )}
      </Container>
    </Section>
  )
}
