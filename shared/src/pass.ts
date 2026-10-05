/**
 * Guest pass (QR code). The QR encodes a normal URL to the pass page, so a
 * guest scanning their own code just opens their pass; the door scanner in
 * the admin parses the same URL. The token is random and stored on the
 * guestlist entry – without it a pass can't be forged or looked up.
 */
export interface PassRef {
  eventId: string
  entryId: string
  token: string
}

export function passUrl(origin: string, ref: PassRef): string {
  return `${origin.replace(/\/$/, '')}/pass/${encodeURIComponent(ref.eventId)}/${encodeURIComponent(ref.entryId)}?t=${encodeURIComponent(ref.token)}`
}

/** Parses a scanned QR text; accepts any origin (preview domains, ajay.at, localhost). */
export function parsePassUrl(text: string): PassRef | null {
  try {
    const url = new URL(text.trim())
    const m = url.pathname.match(/^\/pass\/([^/]+)\/([^/]+)\/?$/)
    const token = url.searchParams.get('t')
    if (!m || !token) return null
    return { eventId: decodeURIComponent(m[1]!), entryId: decodeURIComponent(m[2]!), token }
  } catch {
    return null
  }
}
