/**
 * Seeds the Firestore emulator with the content from SPEC §5.
 * Refuses to run against a real project – only `demo-*` / emulator.
 *
 *   npm run seed            # only fills empty collections
 *   npm run seed -- --force # overwrites seed documents
 */
import { initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import {
  dateToViennaLocal,
  seedLinks,
  seedSite,
  seedTheme,
  viennaLocalToDate,
  type EventDoc,
} from '@ajay/shared'

const projectId = process.env.GCLOUD_PROJECT ?? 'demo-ajay'
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= '127.0.0.1:9099'

if (!projectId.startsWith('demo-')) {
  console.error(`Refusing to seed non-demo project "${projectId}".`)
  process.exit(1)
}

const force = process.argv.includes('--force')
initializeApp({ projectId })
const db = getFirestore()

const DAY = 24 * 60 * 60 * 1000
/** `hh:00` Vienna wall-clock time, `days` from today (correct across DST changes). */
function at(days: number, hour = 22): Timestamp {
  const day = dateToViennaLocal(new Date(Date.now() + days * DAY)).slice(0, 10)
  return Timestamp.fromDate(viennaLocalToDate(`${day}T${String(hour).padStart(2, '0')}:00`))
}

function placeholderEvent(
  n: number,
  days: number,
  extra: Partial<EventDoc<Timestamp>>,
): EventDoc<Timestamp> {
  return {
    slug: `todo-placeholder-event-${n}`,
    title: `TODO – Placeholder Event ${n}`,
    startsAt: at(days),
    endsAt: at(days + 1, 4),
    venue: { name: 'TODO Venue', address: 'TODO Address, Vienna', mapsUrl: '' },
    flyerUrl: '',
    description: {
      en: 'TODO: placeholder event for development. Replace or delete in the admin.',
      de: 'TODO: Platzhalter-Event für die Entwicklung. Im Admin ersetzen oder löschen.',
    },
    lineup: ['AJAY'],
    minAge: 18,
    status: 'published',
    guestlist: { enabled: false, capacity: 0, deadline: null, maxPlusOnes: 0, count: 0 },
    ticketing: { enabled: false, externalUrl: '' },
    createdAt: Timestamp.now(),
    ...extra,
  }
}

const seedEvents: Record<string, EventDoc<Timestamp>> = {
  'todo-event-1': placeholderEvent(1, 10, {
    guestlist: { enabled: true, capacity: 100, deadline: at(10, 18), maxPlusOnes: 2, count: 12 },
  }),
  'todo-event-2': placeholderEvent(2, 24, {
    ticketing: { enabled: false, externalUrl: 'https://example.com/TODO-tickets' },
  }),
  'todo-event-3': placeholderEvent(3, 45, {
    guestlist: { enabled: true, capacity: 50, deadline: at(45, 18), maxPlusOnes: 1, count: 50 },
  }),
  'todo-event-past': placeholderEvent(4, -20, { slug: 'todo-placeholder-past-event' }),
  'todo-event-draft': placeholderEvent(5, 60, { status: 'draft' }),
}

async function writeIfMissing(path: string, data: object) {
  const ref = db.doc(path)
  if (!force && (await ref.get()).exists) return false
  await ref.set(data)
  return true
}

async function main() {
  let written = 0
  const docs: [string, object][] = [
    ['settings/site', seedSite],
    ['settings/theme', seedTheme],
    ...Object.entries(seedLinks).map(([id, d]) => [`links/${id}`, d] as [string, object]),
    ...Object.entries(seedEvents).map(([id, d]) => [`events/${id}`, d] as [string, object]),
  ]
  for (const [path, data] of docs) if (await writeIfMissing(path, data)) written++
  console.log(
    `Seed done: ${written} written, ${docs.length - written} kept (project ${projectId}).`,
  )
  await seedAdminUser()
}

/** Local admin login for the emulator (never created in a real project). */
const DEV_ADMIN = { email: 'admin@ajay.local', password: 'ajay-admin' }

async function seedAdminUser() {
  const auth = getAuth()
  const existing = await auth.getUserByEmail(DEV_ADMIN.email).catch(() => null)
  const user =
    existing ??
    (await auth.createUser({
      email: DEV_ADMIN.email,
      password: DEV_ADMIN.password,
      displayName: 'Ajay (dev)',
    }))
  await auth.setCustomUserClaims(user.uid, { admin: true })
  console.log(
    `Dev admin: ${DEV_ADMIN.email} / ${DEV_ADMIN.password}  →  http://localhost:5173/admin`,
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
