import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore/lite'
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
 * Public site data from Firestore (loaded once, refreshed on tab focus). Settings fall back to the seed
 * defaults so the hero can paint before Firestore answers (LCP).
 */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteSettings>(seedSite)
  const [theme, setTheme] = useState<ThemeSettings>(seedTheme)
  const [links, setLinks] = useState<LinkView[] | null>(null)
  const [events, setEvents] = useState<EventView[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const [siteSnap, themeSnap, linkSnap, eventSnap] = await Promise.all([
        getDoc(doc(db, 'settings/site')),
        getDoc(doc(db, 'settings/theme')),
        getDocs(query(collection(db, 'links'), where('visible', '==', true), orderBy('order'))),
        getDocs(
          query(collection(db, 'events'), where('status', '==', 'published'), orderBy('startsAt')),
        ),
      ])
      if (cancelled) return
      if (siteSnap.exists()) setSite({ ...seedSite, ...(siteSnap.data() as SiteSettings) })
      if (themeSnap.exists()) setTheme({ ...seedTheme, ...(themeSnap.data() as ThemeSettings) })
      setLinks(linkSnap.docs.map((d) => ({ id: d.id, ...(d.data() as LinkDoc) })))
      setEvents(eventSnap.docs.map((d) => toEventView(d.id, d.data() as EventDoc<Timestamp>)))
    }
    const refresh = () => {
      load().catch((err) => {
        console.error('[data] load failed:', err)
        // Show the page with empty lists rather than skeletons forever.
        setLinks((l) => l ?? [])
        setEvents((e) => e ?? [])
      })
    }
    refresh()
    // Pick up admin changes when the visitor returns to the tab.
    const onVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
    }
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
