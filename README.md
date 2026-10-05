# AJAY ADAM – Official Website

DJ & Producer website for AJAY ADAM (Vienna). The spec is in [`SPEC.md`](SPEC.md); current scope is in §18 there.

## Stack

Vite + React 18 + TypeScript · Tailwind CSS v4 · Motion + Lenis · React Router · Firebase (Firestore, Auth, Storage; Functions follow in Phase 4) · react-hook-form + zod · i18next (EN default, DE).

## Structure

```
shared/   zod schemas, types, seed content, event status, .ics + meta tag helpers (+ unit tests)
web/      the site (Vite app)
  src/app         router + providers
  src/routes      pages
  src/features    home sections, events, booking
  src/components  ui primitives + layout (header, menu, footer)
  src/lib         firebase, data provider, theme, formatting
  src/i18n        en.json / de.json
functions/ Cloud Functions (2nd gen, europe-west1), bundled with esbuild
  src/http/ogRenderer.ts        per-event Open Graph / Twitter / JSON-LD for /events/:slug
  src/callable/joinGuestlist.ts guestlist sign-up (transaction: capacity, deadline, duplicates)
  src/callable/submitBooking.ts booking request + notification and receipt mails
  src/mail/templates.ts         e-mail templates (EN/DE)
  test/                         integration tests against the emulators
scripts/  seed.ts, dev-mailer.ts (emulator only)
firestore.rules, storage.rules, firebase.json
```

## Requirements

- Node 20+ and npm
- Java 11+ (for the Firestore emulator)

No Firebase account is needed for local development: everything runs against the
Emulator Suite with the demo project `demo-ajay`.

## Local development

```bash
npm install
npm run dev
```

`npm run dev` builds the functions, starts the Firestore/Auth/Storage/Functions emulators, seeds the content from SPEC §5
and starts Vite.

- Website: http://localhost:5173
- Emulator UI (inspect/edit data): http://localhost:4000

**Testing on your phone:** connect the phone to the same Wi-Fi and open
`http://<your-computer-ip>:5173`. Vite prints the network URL on startup; the app connects to
the emulator on the same host automatically.

The public site reads Firestore with the lightweight Firestore Lite SDK (no realtime listener, for
load performance). Data changes made in the Emulator UI show up after a reload or when you switch
back to the tab.

Emulator data is in-memory and re-seeded on every start. `npm run seed -- --force` resets the
seed documents while the emulators are running.

## Scripts

| Command                   | What it does                          |
| ------------------------- | ------------------------------------- |
| `npm run dev`             | emulators + seed + Vite               |
| `npm run emulators`       | emulators only                        |
| `npm run seed`            | fill empty seed docs in the emulator  |
| `npm run build`           | typecheck + production build of `web` |
| `npm run typecheck`       | TypeScript for all workspaces         |
| `npm run lint` / `format` | ESLint / Prettier                     |

## Content placeholders

Everything Ajay still has to provide is marked `TODO` (bio, Spotify artist URL, WANTED.7 link,
photos, logo, flyers, legal texts). Placeholder events are named `TODO – Placeholder Event n`
and can be deleted in the admin (Phase 5).

## Link previews (Open Graph)

`/events/:slug` is rewritten by Firebase Hosting to the `ogRenderer` function, which returns
`index.html` with the event's title, description, flyer image and schema.org `MusicEvent`
JSON-LD. Messengers and social apps don't run JavaScript, so this is what makes shared event links
show the flyer. To check locally: `npm run serve`, then

```bash
curl -s http://localhost:5000/events/todo-placeholder-event-1 | grep -E "og:|<title>"
```

In production, set `SITE_ORIGIN=https://ajay.at` for the functions so canonical URLs always use the
main domain.

## E-mails

Functions never send mail directly: they write documents to the `mail` collection, which the
**Trigger Email from Firestore** extension delivers in production.

**Locally**, `npm run dev` runs a small dev mailer instead (`scripts/dev-mailer.ts`): every mail is
saved as an HTML preview in `dev-mail/` – open `dev-mail/index.html`. If
[Mailpit](https://mailpit.axllent.org/) is running (`docker run -p 8025:8025 -p 1025:1025
axllent/mailpit` or the Windows `.exe`), mails are additionally delivered there:
http://localhost:8025. The terminal prints a line per mail.

**Production setup** (once, when deploying):

```bash
firebase ext:install firebase/firestore-send-email
```

Use collection `mail`, SMTP of the sending domain (e.g. `smtps://no-reply@ajay.at:PASSWORD@smtp.example.com:465`,
stored as a secret) and default FROM `AJAY ADAM <no-reply@ajay.at>`.

## Spam protection

- Honeypot field in both forms (filled → request silently dropped).
- App Check (reCAPTCHA Enterprise) is enforced on all callables in production; set
  `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY` for the web build. The emulator doesn't enforce it.
- Rate limits per IP hash and e-mail hash in `rateLimits/` (guestlist: 10 per IP / 10 min,
  5 per e-mail / day; booking: 5 per IP / hour, 3 per e-mail / day). In production, add a Firestore
  TTL policy on `rateLimits.expiresAt` so old entries delete themselves.
