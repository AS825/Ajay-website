import { initializeApp, type FirebaseOptions } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore/lite'

const env = import.meta.env
export const useEmulators = env.VITE_USE_EMULATORS === 'true'

/**
 * Web config from web/.env.production (VITE_FIREBASE_*) if present; otherwise
 * from Firebase Hosting's reserved /__/firebase/init.json, which always
 * matches the project the site is deployed to – so a deploy works without
 * any manual config.
 */
async function loadConfig(): Promise<FirebaseOptions> {
  if (env.VITE_FIREBASE_API_KEY) {
    return {
      apiKey: env.VITE_FIREBASE_API_KEY,
      authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
      appId: env.VITE_FIREBASE_APP_ID,
    }
  }
  const res = await fetch('/__/firebase/init.json')
  if (!res.ok)
    throw new Error(
      'Firebase config missing: add web/.env.production or deploy to Firebase Hosting.',
    )
  return (await res.json()) as FirebaseOptions
}

export const app = initializeApp(await loadConfig())

/**
 * The public site only reads, so it uses Firestore Lite (REST, no realtime):
 * ~1/5 of the full SDK, which matters for LCP on 4G. The admin loads the full
 * SDK lazily for live editing.
 */
export const db = getFirestore(app)

if (useEmulators) {
  // Use the page's host so a phone on the same Wi-Fi reaches the emulator too.
  connectFirestoreEmulator(db, window.location.hostname, 8080)
}
