import type { ComponentType } from 'react'
import type { SectionId } from '@ajay/shared'
import { useSiteData } from '../lib/data'
import { Hero } from '../features/home/Hero'
import { Marquee } from '../features/home/Marquee'
import { UpcomingEvents } from '../features/home/UpcomingEvents'
import { Tiles } from '../features/home/Tiles'
import { Music } from '../features/home/Music'
import { Sets } from '../features/home/Sets'
import { Drops } from '../features/home/Drops'
import { About } from '../features/home/About'
import { Support } from '../features/home/Support'
import { BookingSection } from '../features/booking/BookingSection'

const SECTIONS: Record<SectionId, ComponentType> = {
  marquee: Marquee,
  events: UpcomingEvents,
  tiles: Tiles,
  music: Music,
  sets: Sets,
  drops: Drops,
  about: About,
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
