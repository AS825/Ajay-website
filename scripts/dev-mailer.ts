/**
 * Local stand-in for the "Trigger Email from Firestore" extension.
 *
 * Watches the `mail` collection in the Firestore emulator and, for each new
 * document, writes an HTML preview to ./dev-mail/ (open dev-mail/index.html)
 * and – if Mailpit is running on localhost:1025 – also delivers it there
 * (http://localhost:8025). Sets `delivery` on the doc like the extension does.
 */
import { mkdirSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createConnection } from 'node:net'
import { initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import nodemailer from 'nodemailer'

const projectId = process.env.GCLOUD_PROJECT ?? 'demo-ajay'
process.env.FIRESTORE_EMULATOR_HOST ??= '127.0.0.1:8080'
if (!projectId.startsWith('demo-')) throw new Error('dev-mailer only runs against the emulator')

const FROM = 'AJAY ADAM <no-reply@ajay.at>'
const OUT = resolve(import.meta.dirname, '..', 'dev-mail')
mkdirSync(OUT, { recursive: true })

initializeApp({ projectId })
const db = getFirestore()

interface MailDoc {
  to: string | string[]
  replyTo?: string
  message: { subject: string; html: string; text: string }
  delivery?: unknown
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function mailpitAvailable(): Promise<boolean> {
  return new Promise((done) => {
    const socket = createConnection({ host: '127.0.0.1', port: 1025 })
    socket.setTimeout(500)
    socket.once('connect', () => (socket.destroy(), done(true)))
    socket.once('error', () => done(false))
    socket.once('timeout', () => (socket.destroy(), done(false)))
  })
}

function writeIndex() {
  const files = readdirSync(OUT)
    .filter((f) => f.endsWith('.html') && f !== 'index.html')
    .sort()
    .reverse()
  const items = files.map((f) => `<li><a href="${f}">${esc(f)}</a></li>`).join('')
  writeFileSync(
    join(OUT, 'index.html'),
    `<!doctype html><meta charset="utf-8"><title>Dev mail</title><body style="font-family:system-ui;background:#111;color:#eee;padding:24px"><h1>Dev mail (${files.length})</h1><ul>${items}</ul><style>a{color:#ff6b6b}li{margin:6px 0}</style>`,
  )
}

const transport = nodemailer.createTransport({ host: '127.0.0.1', port: 1025, secure: false })
const seen = new Set<string>()

db.collection('mail').onSnapshot(async (snap) => {
  const viaMailpit = await mailpitAvailable()
  for (const change of snap.docChanges()) {
    const doc = change.doc
    const mail = doc.data() as MailDoc
    if (change.type !== 'added' || mail.delivery || seen.has(doc.id)) continue
    seen.add(doc.id)

    const to = Array.isArray(mail.to) ? mail.to.join(', ') : mail.to
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const name = `${stamp}-${mail.message.subject.replace(/[^\w-]+/g, '-').slice(0, 60)}.html`
    const header = `<div style="font:13px system-ui;background:#fff;color:#111;padding:12px 16px;border-bottom:3px solid #ff2d2d"><b>To:</b> ${esc(to)}${mail.replyTo ? ` &nbsp; <b>Reply-To:</b> ${esc(mail.replyTo)}` : ''}<br><b>Subject:</b> ${esc(mail.message.subject)}</div>`
    writeFileSync(join(OUT, name), mail.message.html.replace(/<body([^>]*)>/i, `<body$1>${header}`))
    writeIndex()

    let state = 'PREVIEW'
    if (viaMailpit) {
      try {
        await transport.sendMail({
          from: FROM,
          to,
          replyTo: mail.replyTo,
          subject: mail.message.subject,
          html: mail.message.html,
          text: mail.message.text,
        })
        state = 'SUCCESS'
      } catch (err) {
        console.error('[mail] Mailpit delivery failed:', err)
      }
    }
    await doc.ref.update({
      delivery: { state, endTime: FieldValue.serverTimestamp(), info: { preview: name } },
    })
    console.log(
      `📧 ${to} — ${mail.message.subject}\n   → dev-mail/${name}${state === 'SUCCESS' ? ' + Mailpit http://localhost:8025' : ''}`,
    )
  }
})

console.log(`[mail] Watching "mail" in the emulator. Previews: ${join(OUT, 'index.html')}`)
