import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'

/**
 * Lets an allow-listed person activate their own admin access (SPEC §10) –
 * no service-account keys needed. The allow-list is ADMIN_EMAILS in
 * functions/.env; the e-mail must be verified (Google sign-in always is).
 */
export const claimAdmin = onCall({ memory: '256MiB' }, async (req) => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sign in first.')
  const email = (req.auth.token.email ?? '').toLowerCase()
  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  if (!email || req.auth.token.email_verified !== true || !allowed.includes(email)) {
    throw new HttpsError('permission-denied', 'This account is not on the admin list.', {
      reason: 'notAllowed',
    })
  }
  const user = await getAuth().getUser(req.auth.uid)
  await getAuth().setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: true })
  return { ok: true }
})
