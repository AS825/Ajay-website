import { initializeApp } from 'firebase/app'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore/lite'

const env = import.meta.env
export const useEmulators = env.VITE_USE_EMULATORS === 'true'

export const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID,
})

/**
 * The public site only reads, so it uses Firestore Lite (REST, no realtime):
 * ~1/5 of the full SDK, which matters for LCP on 4G. The admin (Phase 5)
 * loads the full SDK lazily for live editing.
 */
export const db = getFirestore(app)

if (useEmulators) {
  // Use the page's host so a phone on the same Wi-Fi reaches the emulator too.
  connectFirestoreEmulator(db, window.location.hostname, 8080)
}
