# AJAY ADAM – Official Website

DJ & Producer website for AJAY ADAM (Vienna). The spec is in [`SPEC.md`](SPEC.md); current scope is in §18 there.

## Stack

Vite + React 18 + TypeScript · Tailwind CSS v4 · React Router · Firebase (Firestore, Auth, Storage; Functions follow in Phase 4) · react-hook-form + zod · i18next (EN default, DE).

## Structure

```
shared/   zod schemas, types, seed content (used by web + scripts, later functions)
web/      the site (Vite app)
  src/app         router + providers
  src/routes      pages
  src/features    home sections, events, booking
  src/components  ui primitives + layout (header, menu, footer)
  src/lib         firebase, data provider, theme, formatting
  src/i18n        en.json / de.json
scripts/  seed.ts (emulator only)
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

`npm run dev` starts the Firestore/Auth/Storage emulators, seeds the content from SPEC §5
and starts Vite.

- Website: http://localhost:5173
- Emulator UI (inspect/edit data): http://localhost:4000

**Testing on your phone:** connect the phone to the same Wi-Fi and open
`http://<your-computer-ip>:5173`. Vite prints the network URL on startup; the app connects to
the emulator on the same host automatically.

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
