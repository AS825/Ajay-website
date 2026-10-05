/**
 * Admin-only Firebase services. This module is part of the lazily loaded
 * admin chunk, so visitors never download Auth, Storage or the full Firestore SDK.
 * The full SDK (not Lite) gives realtime updates while editing.
 */
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'
import { connectStorageEmulator, getStorage } from 'firebase/storage'
import { app, useEmulators } from '../lib/firebase'

export const auth = getAuth(app)
export const adminDb = getFirestore(app)
export const storage = getStorage(app)

if (useEmulators) {
  const host = window.location.hostname
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
  connectFirestoreEmulator(adminDb, host, 8080)
  connectStorageEmulator(storage, host, 9199)
}
