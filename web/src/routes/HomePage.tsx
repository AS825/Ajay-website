import type { ComponentType } from 'react'
import type { SectionId } from '@ajay/shared'
import { useSiteData } from '../lib/data'
import { Hero } from '../features/home/Hero'
import { Marquee } from '../features/home/Marquee'
import { UpcomingEvents } from '../features/home/UpcomingEvents'
import { Tiles } from '../features/home/Tiles'
import { Music } from '../features/home/Music'
import { Sets } from '../features/home/Sets'
import { Instagram } from '../features/home/Instagram'
import { Drops } from '../features/home/Drops'
import { About } from '../features/home/About'
import { MainInfo } from '../features/home/MainInfo'
import { Stats } from '../features/home/Stats'
import { Venues } from '../features/home/Venues'
import { Rider } from '../features/home/Rider'
import { LiveSets } from '../features/home/LiveSets'
import { Lection } from '../features/home/Lection'
import { Contact } from '../features/home/Contact'
import { Support } from '../features/home/Support'
import { BookingSection } from '../features/booking/BookingSection'

const SECTIONS: Record<SectionId, ComponentType> = {
  marquee: Marquee,
  events: UpcomingEvents,
  tiles: Tiles,
  music: Music,
  sets: Sets,
  instagram: Instagram,
  drops: Drops,
  about: About,
  info: MainInfo,
  stats: Stats,
  venues: Venues,
  rider: Rider,
  livesets: LiveSets,
  lection: Lection,
  contact: Contact,
  booking: BookingSection,
  support: Support,
}

/** One-pager; order and visibility of sections come from settings/site. */
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
