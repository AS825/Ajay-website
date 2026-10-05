import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { callableOptions } from '../lib/env'
import { runFeedSync } from '../feeds/sync'

/** Hourly: new YouTube uploads / Instagram posts appear on the site automatically. */
export const syncFeedsScheduled = onSchedule(
  { schedule: 'every 60 minutes', timeZone: 'Europe/Vienna', memory: '512MiB' },
  async () => {
    await runFeedSync()
  },
)

/** "Sync now" button in the admin (also how it runs in the emulator, which has no scheduler). */
export const syncFeeds = onCall(
  { ...callableOptions, memory: '512MiB', timeoutSeconds: 120 },
  async (req) => {
    if (req.auth?.token.admin !== true) throw new HttpsError('permission-denied', 'Admins only.')
    return runFeedSync()
  },
)
