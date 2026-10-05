export const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true'

/** Public site origin for links in e-mails (functions/.env, overridden by .env.local in the emulator). */
export function siteOrigin(): string {
  return (process.env.SITE_ORIGIN ?? 'https://ajay.at').replace(/\/$/, '')
}

/**
 * App Check on all callables (SPEC §12). The emulator can't verify tokens from
 * the local site, so it's only enforced in production.
 */
export const callableOptions = { enforceAppCheck: !isEmulator, memory: '256MiB' as const }
