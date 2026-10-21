/**
 * Features that need the Firebase Blaze plan. While the project runs on the free
 * Spark plan, both stay off: images ship with the site and events link to an
 * external guestlist page.
 */

/** Firebase Storage (uploads in the admin). */
export const STORAGE_ENABLED = false

/** Own guestlist with QR passes (Cloud Functions). */
export const OWN_GUESTLIST = false
