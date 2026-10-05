export const isEmulator = process.env.FUNCTIONS_EMULATOR === 'true'

/** Public site origin for links in e-mails: SITE_ORIGIN, else the project's default Hosting domain. */
export function siteOrigin(): string {
  const configured = process.env.SITE_ORIGIN?.trim()
  if (configured) return configured.replace(/\/$/, '')
  return `https://${process.env.GCLOUD_PROJECT ?? 'ajay'}.web.app`
}

/**
 * App Check on the public callables (SPEC §12). Switched on via
 * ENFORCE_APP_CHECK=true once reCAPTCHA Enterprise is configured; never in the emulator.
 */
export const callableOptions = {
  enforceAppCheck: !isEmulator && process.env.ENFORCE_APP_CHECK === 'true',
  memory: '256MiB' as const,
}
