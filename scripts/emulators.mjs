// Starts the Firebase emulators with persistent local data.
//
//   node scripts/emulators.mjs exec  "<command>"   (used by npm run dev / serve)
//   node scripts/emulators.mjs start               (used by npm run emulators)
//   add --hosting to also start the Hosting emulator
//
// Data is saved to ./emulator-data when the emulators stop (Ctrl+C) and loaded
// again on the next start, so events, uploads and logins survive restarts.
// `npm run reset` deletes it and the next start begins with fresh seed data.
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'

const DATA_DIR = './emulator-data'
const [mode, ...rest] = process.argv.slice(2)
const hosting = rest.includes('--hosting')
const command = rest.filter((a) => a !== '--hosting')[0]

const only = ['firestore', 'auth', 'storage', 'functions', ...(hosting ? ['hosting'] : [])].join(
  ',',
)
const args = [
  `emulators:${mode}`,
  '--project',
  'demo-ajay',
  '--only',
  only,
  '--export-on-exit',
  DATA_DIR,
]
if (existsSync(`${DATA_DIR}/firebase-export-metadata.json`)) args.push('--import', DATA_DIR)
if (mode === 'exec') args.push('--ui', command)

// Call the CLI's entry directly (no shell), so the command needs no extra quoting on Windows.
const firebaseBin = createRequire(import.meta.url).resolve('firebase-tools/lib/bin/firebase.js')
const child = spawn(process.execPath, [firebaseBin, ...args], { stdio: 'inherit' })
// Ctrl+C reaches the child directly (same process group); just wait for it to export and exit.
process.on('SIGINT', () => {})
child.on('exit', (code) => process.exit(code ?? 0))
