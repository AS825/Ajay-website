// Runs Vite and the dev mailer side by side inside `firebase emulators:exec`.
import { spawn } from 'node:child_process'

const procs = [
  ['web', 'npm run dev -w web'],
  ['mail', 'npm run mailer -w scripts'],
].map(([name, cmd]) => {
  const p = spawn(cmd, { shell: true, stdio: 'inherit', env: process.env })
  p.on('exit', (code) => {
    console.log(`[${name}] exited (${code})`)
    shutdown(code ?? 0)
  })
  return p
})

let stopping = false
function shutdown(code) {
  if (stopping) return
  stopping = true
  for (const p of procs) p.kill()
  process.exit(code)
}
process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
