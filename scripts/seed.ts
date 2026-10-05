/**
 * Seeds the Firestore emulator with the content from SPEC §5.
 * Refuses to run against a real project – only `demo-*` / emulator.
 *
 *   npm run seed            # only fills empty collections
 *   npm run seed -- --force # overwrites seed documents
 */
import { initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'
import { seedLinks, seedSite, seedTheme, type EventDoc } from '@ajay/shared'

const projectId = process.env.GCLOUD_PROJECT ?? 'demo-ajay'
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'

if (!projectId.startsWith('demo-')) {
  console.error(`Refusing to seed non-demo project "${projectId}".`)
  process.exit(1)
}

const force = process.argv.includes('--force')
initializeApp({ projectId })
const db = getFirestore()

const DAY = 24 * 60 * 60 * 1000
/** Date at 22:00 Vienna time (approx., UTC+1/+2), `days` from today. */
function at(days: number, hourUtc = 20): Timestamp {
  const d = new Date(Date.now() + days * DAY)
  d.setUTCHours(hourUtc, 0, 0, 0)
  return Timestamp.fromDate(d)
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
    guestlist: { enabled: true, capacity: 100, deadline: at(10, 16), maxPlusOnes: 2, count: 12 },
  }),
  'todo-event-2': placeholderEvent(2, 24, {
    ticketing: { enabled: false, externalUrl: 'https://example.com/TODO-tickets' },
  }),
  'todo-event-3': placeholderEvent(3, 45, {
    guestlist: { enabled: true, capacity: 50, deadline: at(45, 16), maxPlusOnes: 1, count: 50 },
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
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
