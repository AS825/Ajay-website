/**
 * Grants (or revokes) the `admin` custom claim (SPEC §10).
 *
 *   Emulator:   npm run set-admin -- someone@example.com
 *   Production: GOOGLE_APPLICATION_CREDENTIALS=key.json npm run set-admin -- --project <id> someone@example.com
 *   Revoke:     add --revoke
 *
 * The user must have signed in once (or exist in Auth). They need to sign out
 * and in again for the new claim to take effect.
 */
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const args = process.argv.slice(2)
const flag = (name: string) => args.includes(name)
const projectIdx = args.indexOf('--project')
const projectId =
  projectIdx >= 0 ? args[projectIdx + 1] : (process.env.GCLOUD_PROJECT ?? 'demo-ajay')
const email = args.find((a, i) => a.includes('@') && args[i - 1] !== '--project')

if (!email || !projectId) {
  console.error('Usage: npm run set-admin -- [--project <id>] [--revoke] <email>')
  process.exit(1)
}

if (projectId.startsWith('demo-')) process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'
else if (process.env.FIREBASE_AUTH_EMULATOR_HOST) {
  console.error(
    'FIREBASE_AUTH_EMULATOR_HOST is set but the project is not a demo project – aborting.',
  )
  process.exit(1)
}

initializeApp({ projectId })
const auth = getAuth()

const user = await auth.getUserByEmail(email).catch(() => null)
if (!user) {
  console.error(`No user with e-mail ${email} in project ${projectId}. Sign in once first.`)
  process.exit(1)
}
const revoke = flag('--revoke')
await auth.setCustomUserClaims(user.uid, { ...(user.customClaims ?? {}), admin: !revoke })
console.log(`${revoke ? 'Revoked' : 'Granted'} admin for ${email} (${user.uid}) in ${projectId}.`)
