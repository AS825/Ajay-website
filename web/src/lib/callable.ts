import type { FormErrorReason } from '@ajay/shared'
import { app, useEmulators } from './firebase'

/**
 * Callable Cloud Functions, loaded on demand (only form pages need them).
 * App Check (reCAPTCHA Enterprise) is activated when a site key is configured,
 * which is the case in production; the emulator doesn't enforce it.
 */
let ready: Promise<import('firebase/functions').Functions> | null = null

function functionsInstance() {
  ready ??= (async () => {
    const siteKey = import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY as string | undefined
    if (siteKey) {
      const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import('firebase/app-check')
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(siteKey),
        isTokenAutoRefreshEnabled: true,
      })
    }
    const { getFunctions, connectFunctionsEmulator } = await import('firebase/functions')
    const fns = getFunctions(app, 'europe-west1')
    if (useEmulators) connectFunctionsEmulator(fns, window.location.hostname, 5001)
    return fns
  })()
  return ready
}

export async function callFunction<Req, Res>(name: string, data: Req): Promise<Res> {
  const fns = await functionsInstance()
  const { httpsCallable } = await import('firebase/functions')
  const result = await httpsCallable<Req, Res>(fns, name)(data)
  return result.data
}

export type CallErrorReason = FormErrorReason | 'network' | 'unknown'

/** Maps a callable error to a reason the UI can translate (errors.call.<reason>). */
export function callErrorReason(err: unknown): CallErrorReason {
  const e = err as { code?: string; details?: { reason?: FormErrorReason } }
  if (e?.details?.reason) return e.details.reason
  if (e?.code === 'functions/resource-exhausted') return 'rateLimited'
  if (e?.code === 'functions/unavailable' || e?.code === 'functions/deadline-exceeded')
    return 'network'
  if (e?.code === 'functions/internal' && !navigator.onLine) return 'network'
  return 'unknown'
}
