import { initializeApp } from 'firebase/app'
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

const env = import.meta.env
const useEmulators = env.VITE_USE_EMULATORS === 'true'

export const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  appId: env.VITE_FIREBASE_APP_ID,
})

// Offline cache makes repeat visits instant in production. Not used against
// the emulator so a re-seed is always visible immediately.
export const db = initializeFirestore(
  app,
  useEmulators
    ? {}
    : { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
)

if (useEmulators) {
  // Use the page's host so a phone on the same Wi-Fi reaches the emulator too.
  connectFirestoreEmulator(db, window.location.hostname, 8080)
}
