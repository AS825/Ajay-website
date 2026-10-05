import { createHash } from 'node:crypto'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https'

export function hashKey(value: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? 'ajay'
  return createHash('sha256').update(`${salt}:${value}`).digest('hex').slice(0, 40)
}

export function clientIp(req: CallableRequest): string {
  const fwd = req.rawRequest.headers['x-forwarded-for']
  const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim()
  return first || req.rawRequest.ip || 'unknown'
}

/**
 * Fixed-window rate limit stored in `rateLimits/{action:hash}` (SPEC §12).
 * Only hashes are stored, never raw IPs or e-mails. `expiresAt` is meant for a
 * Firestore TTL policy so old windows clean themselves up.
 */
export async function enforceRateLimit(
  action: string,
  value: string,
  limit: number,
  windowMs: number,
) {
  const db = getFirestore()
  const ref = db.collection('rateLimits').doc(`${action}_${hashKey(value)}`)
  const allowed = await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const now = Date.now()
    const d = snap.data() as { count: number; windowStart: number } | undefined
    if (!d || now - d.windowStart > windowMs) {
      tx.set(ref, { count: 1, windowStart: now, expiresAt: Timestamp.fromMillis(now + windowMs) })
      return true
    }
    if (d.count >= limit) return false
    tx.update(ref, { count: d.count + 1 })
    return true
  })
  if (!allowed) {
    throw new HttpsError('resource-exhausted', 'Too many requests, please try again later.', {
      reason: 'rateLimited',
    })
  }
}
