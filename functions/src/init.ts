/**
 * Side-effect module, imported first by index.ts: ES imports are evaluated in
 * order, so global options apply before any function is defined.
 */
import { setGlobalOptions } from 'firebase-functions/v2'
import { initializeApp } from 'firebase-admin/app'

initializeApp()
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 })
