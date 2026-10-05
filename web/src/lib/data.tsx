import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore'
import {
  seedSite,
  seedTheme,
  type EventDoc,
  type LinkCategory,
  type LinkDoc,
  type SiteSettings,
  type ThemeSettings,
} from '@ajay/shared'
import { db } from './firebase'
import { applyTheme } from './theme'
import type { EventView } from './events'

export type LinkView = LinkDoc & { id: string }

interface SiteData {
  site: SiteSettings
  theme: ThemeSettings
  links: LinkView[]
  events: EventView[]
  /** False until links and events have arrived at least once. */
  ready: boolean
  linksBy(category: LinkCategory): LinkView[]
}

const SiteDataContext = createContext<SiteData | null>(null)

function toEventView(id: string, d: EventDoc<Timestamp>): EventView {
  return {
    ...d,
    id,
    startsAt: d.startsAt.toDate(),
    endsAt: d.endsAt.toDate(),
    createdAt: d.createdAt.toDate(),
    guestlist: { ...d.guestlist, deadline: d.guestlist.deadline?.toDate() ?? null },
  }
}

/**
 * Live public site data from Firestore. Settings fall back to the seed
 * defaults so the hero can paint before Firestore answers (LCP).
 */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteSettings>(seedSite)
  const [theme, setTheme] = useState<ThemeSettings>(seedTheme)
  const [links, setLinks] = useState<LinkView[] | null>(null)
  const [events, setEvents] = useState<EventView[] | null>(null)

  useEffect(() => {
    const onError = (what: string) => (err: Error) => console.error(`[data] ${what}:`, err)
    const unsubs = [
      onSnapshot(
        doc(db, 'settings/site'),
        (s) => s.exists() && setSite({ ...seedSite, ...(s.data() as SiteSettings) }),
        onError('settings/site'),
      ),
      onSnapshot(
        doc(db, 'settings/theme'),
        (s) => s.exists() && setTheme({ ...seedTheme, ...(s.data() as ThemeSettings) }),
        onError('settings/theme'),
      ),
      onSnapshot(
        query(collection(db, 'links'), where('visible', '==', true), orderBy('order')),
        (s) => setLinks(s.docs.map((d) => ({ id: d.id, ...(d.data() as LinkDoc) }))),
        onError('links'),
      ),
      onSnapshot(
        query(collection(db, 'events'), where('status', '==', 'published'), orderBy('startsAt')),
        (s) => setEvents(s.docs.map((d) => toEventView(d.id, d.data() as EventDoc<Timestamp>))),
        onError('events'),
      ),
    ]
    return () => unsubs.forEach((u) => u())
  }, [])

  useEffect(() => applyTheme(theme), [theme])

  const value = useMemo<SiteData>(
    () => ({
      site,
      theme,
      links: links ?? [],
      events: events ?? [],
      ready: links !== null && events !== null,
      linksBy: (category) => (links ?? []).filter((l) => l.category === category),
    }),
    [site, theme, links, events],
  )

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

export function useSiteData(): SiteData {
  const ctx = useContext(SiteDataContext)
  if (!ctx) throw new Error('useSiteData must be used inside <SiteDataProvider>')
  return ctx
}
