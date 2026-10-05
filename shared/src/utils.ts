import type { Localized } from './types'

export type Lang = 'en' | 'de'

export function localize(value: Localized | undefined, lang: Lang): string {
  if (!value) return ''
  return (lang === 'de' && value.de?.trim()) || value.en
}

export function isTodo(value: string | undefined): boolean {
  return !value || value.trim().startsWith('TODO')
}

/** Extracts a YouTube video id from watch/share/embed URLs. */
export function youtubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1) || null
    if (u.searchParams.get('v')) return u.searchParams.get('v')
    const m = u.pathname.match(/\/(?:embed|shorts)\/([\w-]{6,})/)
    return m?.[1] ?? null
  } catch {
    return null
  }
}

export function youtubePlaylistId(url: string): string | null {
  try {
    return new URL(url).searchParams.get('list')
  } catch {
    return null
  }
}

export const EVENT_TIME_ZONE = 'Europe/Vienna'
