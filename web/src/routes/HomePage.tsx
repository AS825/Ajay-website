import type { ComponentType } from 'react'
import type { SectionId } from '@ajay/shared'
import { useSiteData } from '../lib/data'
import { Hero } from '../features/home/Hero'
import { About } from '../features/home/About'
import { MainInfo } from '../features/home/MainInfo'
import { Stats } from '../features/home/Stats'
import { Venues } from '../features/home/Venues'
import { Artists } from '../features/home/Artists'
import { Produced } from '../features/home/Produced'
import { Rider } from '../features/home/Rider'
import { LiveSets } from '../features/home/LiveSets'
import { UpcomingEvents } from '../features/home/UpcomingEvents'
import { Contact } from '../features/home/Contact'
import { Links } from '../features/home/Links'

const SECTIONS: Record<SectionId, ComponentType> = {
  about: About,
  info: MainInfo,
  stats: Stats,
  venues: Venues,
  artists: Artists,
  produced: Produced,
  rider: Rider,
  livesets: LiveSets,
  events: UpcomingEvents,
  links: Links,
  contact: Contact,
}

/** One-pager in the order of the press kit; order and visibility come from settings/site. */
export function HomePage() {
  const { site } = useSiteData()
  return (
    <>
      <Hero />
      {site.sections
        .filter((s) => s.visible && SECTIONS[s.id])
        .map((s) => {
          const Component = SECTIONS[s.id]
          return <Component key={s.id} />
        })}
    </>
  )
}
