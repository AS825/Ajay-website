import { z } from 'zod'

export const EVENT_TYPES = ['club', 'festival', 'private', 'corporate', 'wedding', 'other'] as const

// TODO(Ajay): confirm set lengths and budget ranges.
export const SET_LENGTHS = ['1h', '2h', '3h', '4h+'] as const
export const BUDGET_RANGES = ['lt500', '500to1000', '1000to2000', 'gt2000', 'tbd'] as const

/**
 * Booking request. Shared between the form (react-hook-form) and the
 * `submitBooking` Cloud Function (Phase 4). Error messages are i18n keys.
 */
export const bookingSchema = z.object({
  name: z.string().trim().min(2, 'errors.required').max(120),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  email: z.email('errors.email').max(200),
  phone: z.string().trim().min(5, 'errors.phone').max(40),
  eventType: z.enum(EVENT_TYPES, 'errors.required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'errors.date'),
  location: z.string().trim().min(2, 'errors.required').max(200),
  setLength: z.enum(SET_LENGTHS, 'errors.required'),
  expectedGuests: z.coerce
    .number<string>('errors.number')
    .int()
    .min(1, 'errors.number')
    .max(1_000_000),
  budget: z.enum(BUDGET_RANGES, 'errors.required'),
  message: z.string().trim().max(3000).optional().or(z.literal('')),
  privacyAccepted: z.literal(true, 'errors.privacy'),
  /** Honeypot – real users leave it empty; the function silently drops filled ones. */
  website: z.string().max(500).optional(),
})

export type BookingInput = z.input<typeof bookingSchema>
export type Booking = z.output<typeof bookingSchema>

export const MAX_PLUS_ONES_LIMIT = 10

/**
 * Guestlist sign-up (SPEC §7). The per-event maxPlusOnes is enforced by the
 * `joinGuestlist` function; the form additionally caps it in the UI.
 */
export const guestlistSchema = z.object({
  eventId: z.string().min(1).max(200),
  firstName: z.string().trim().min(1, 'errors.required').max(80),
  lastName: z.string().trim().min(1, 'errors.required').max(80),
  email: z.email('errors.email').max(200),
  phone: z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === '' || v.replace(/\D/g, '').length >= 5, 'errors.phone')
    .optional(),
  plusOnes: z.number().int().min(0).max(MAX_PLUS_ONES_LIMIT),
  privacyAccepted: z.literal(true, 'errors.privacy'),
  /** Separate, never pre-checked (SPEC §14). */
  newsletter: z.boolean().default(false),
  lang: z.enum(['en', 'de']).default('en'),
  /** Honeypot – real users leave it empty; the function silently drops filled ones. */
  website: z.string().max(500).optional(),
})

export type GuestlistInput = z.input<typeof guestlistSchema>
export type Guestlist = z.output<typeof guestlistSchema>

export type GuestlistStatus = 'confirmed' | 'waitlist'
export interface JoinGuestlistResult {
  status: GuestlistStatus
}

/** Booking request as sent to `submitBooking` (form fields + UI language). */
export const bookingRequestSchema = bookingSchema.extend({
  lang: z.enum(['en', 'de']).default('en'),
})
export type BookingRequest = z.input<typeof bookingRequestSchema>

/** Error reasons returned by the callables in HttpsError details, mapped to i18n keys in the UI. */
export type FormErrorReason =
  'duplicate' | 'closed' | 'past' | 'notFound' | 'tooManyPlusOnes' | 'rateLimited' | 'invalid'
