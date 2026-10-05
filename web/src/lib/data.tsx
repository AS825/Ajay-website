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
  normalizeSections,
  seedSite,
  seedTheme,
  type EventDoc,
  type FeedDoc,
  type FeedPost,
  type FeedVideo,
  type LinkCategory,
  type LinkDoc,
  type SiteSettings,
  type ThemeSettings,
} from '@ajay/shared'
import { db } from './firebase'
import { applyTheme } from './theme'
import { PREVIEW_READY, PREVIEW_STATE, isPreview, type PreviewState } from './preview'
import type { EventView } from './events'

export type LinkView = LinkDoc & { id: string }

interface SiteData {
  site: SiteSettings
  theme: ThemeSettings
  links: LinkView[]
  events: EventView[]
  /** Auto-synced latest YouTube uploads / Instagram posts (empty until the first sync). */
  videos: FeedVideo[]
  posts: FeedPost[]
  /** False until links and events have arrived at least once. */
  ready: boolean
  linksBy(category: LinkCategory): LinkView[]
  /** Re-fetch everything (e.g. after a guestlist sign-up changed the count). */
  reload(): void
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

interface Snapshot {
  site: SiteSettings | null
  theme: ThemeSettings | null
  links: LinkView[]
  events: EventView[]
  videos: FeedVideo[]
  posts: FeedPost[]
}

const CACHE_KEY = 'ajay:site-data:v1'

/**
 * Last successfully loaded content, kept in localStorage: the page renders it
 * immediately on the next visit and keeps showing it if the network fails
 * (club Wi-Fi, tunnels) instead of "no upcoming events".
 */
function readCache(): Snapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Snapshot
    const date = (v: unknown) => new Date(v as string)
    data.events = data.events.map((e) => ({
      ...e,
      startsAt: date(e.startsAt),
      endsAt: date(e.endsAt),
      createdAt: date(e.createdAt),
      guestlist: {
        ...e.guestlist,
        deadline: e.guestlist.deadline ? date(e.guestlist.deadline) : null,
      },
    }))
    return data
  } catch {
    return null
  }
}

function writeCache(data: Snapshot) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    /* storage full or blocked – caching is optional */
  }
}

const RETRY_DELAYS_MS = [1500, 4000, 10000]
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Public site data from Firestore: shown from the local cache first, then loaded (with retries),
 * refreshed on tab focus and when the connection comes back. Settings fall back to the seed
 * defaults so the hero can paint before Firestore answers (LCP).
 */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const [cached] = useState(() => (isPreview() ? null : readCache()))
  const [site, setSite] = useState<SiteSettings>(cached?.site ?? seedSite)
  const [theme, setTheme] = useState<ThemeSettings>(cached?.theme ?? seedTheme)
  const [links, setLinks] = useState<LinkView[] | null>(cached?.links ?? null)
  const [events, setEvents] = useState<EventView[] | null>(cached?.events ?? null)
  const [version, setVersion] = useState(0)
  const [videos, setVideos] = useState<FeedVideo[]>(cached?.videos ?? [])
  const [posts, setPosts] = useState<FeedPost[]>(cached?.posts ?? [])
  const [preview, setPreview] = useState<PreviewState | null>(null)

  // Design editor live preview: the admin posts unsaved theme/sections into this iframe.
  useEffect(() => {
    if (!isPreview()) return
    const onMessage = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === PREVIEW_STATE)
        setPreview(e.data as PreviewState)
    }
    window.addEventListener('message', onMessage)
    window.parent.postMessage({ type: PREVIEW_READY }, window.location.origin)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const [siteSnap, themeSnap, linkSnap, eventSnap, ytSnap, igSnap] = await Promise.all([
        getDoc(doc(db, 'settings/site')),
        getDoc(doc(db, 'settings/theme')),
        getDocs(query(collection(db, 'links'), where('visible', '==', true), orderBy('order'))),
        getDocs(
          query(collection(db, 'events'), where('status', '==', 'published'), orderBy('startsAt')),
        ),
        getDoc(doc(db, 'feeds/youtube')),
        getDoc(doc(db, 'feeds/instagram')),
      ])
      if (cancelled) return
      const nextSite = siteSnap.exists()
        ? (() => {
            const data = siteSnap.data() as SiteSettings
            // Sections added in newer versions (e.g. instagram) show up without a manual migration.
            return { ...seedSite, ...data, sections: normalizeSections(data.sections) }
          })()
        : null
      const nextTheme = themeSnap.exists()
        ? { ...seedTheme, ...(themeSnap.data() as ThemeSettings) }
        : null
      const snapshot: Snapshot = {
        site: nextSite,
        theme: nextTheme,
        links: linkSnap.docs.map((d) => ({ id: d.id, ...(d.data() as LinkDoc) })),
        events: eventSnap.docs.map((d) => toEventView(d.id, d.data() as EventDoc<Timestamp>)),
        videos: (ytSnap.data() as FeedDoc<FeedVideo> | undefined)?.items ?? [],
        posts: (igSnap.data() as FeedDoc<FeedPost> | undefined)?.items ?? [],
      }
      if (nextSite) setSite(nextSite)
      if (nextTheme) setTheme(nextTheme)
      setLinks(snapshot.links)
      setEvents(snapshot.events)
      setVideos(snapshot.videos)
      setPosts(snapshot.posts)
      if (!isPreview()) writeCache(snapshot)
    }
    let running = false
    const refresh = async () => {
      if (running) return
      running = true
      try {
        for (let attempt = 0; ; attempt++) {
          try {
            await load()
            return
          } catch (err) {
            console.warn(`[data] load failed (attempt ${attempt + 1}):`, err)
            if (cancelled || attempt >= RETRY_DELAYS_MS.length) break
            await sleep(RETRY_DELAYS_MS[attempt]!)
          }
        }
        // Give up for now: keep whatever is shown (cached or loaded); only end the skeleton.
        if (!cancelled) {
          setLinks((l) => l ?? [])
          setEvents((e) => e ?? [])
        }
      } finally {
        running = false
      }
    }
    void refresh()
    // Pick up admin changes when the visitor returns to the tab, and recover after going offline.
    const onVisible = () => document.visibilityState === 'visible' && void refresh()
    const onOnline = () => void refresh()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onOnline)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('online', onOnline)
    }
  }, [version])

  const effectiveTheme = preview?.theme ?? theme
  const effectiveSite = useMemo(
    () => (preview ? { ...site, sections: normalizeSections(preview.sections) } : site),
    [preview, site],
  )
  useEffect(() => applyTheme(effectiveTheme), [effectiveTheme])

  const value = useMemo<SiteData>(
    () => ({
      site: effectiveSite,
      theme: effectiveTheme,
      links: links ?? [],
      events: events ?? [],
      videos,
      posts,
      ready: links !== null && events !== null,
      linksBy: (category) => (links ?? []).filter((l) => l.category === category),
      reload: () => setVersion((v) => v + 1),
    }),
    [effectiveSite, effectiveTheme, links, events, videos, posts],
  )

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

export function useSiteData(): SiteData {
  const ctx = useContext(SiteDataContext)
  if (!ctx) throw new Error('useSiteData must be used inside <SiteDataProvider>')
  return ctx
}
