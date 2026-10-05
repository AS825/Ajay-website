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
  /** Honeypot – must stay empty. */
  website: z.string().max(0).optional().or(z.literal('')),
})

export type BookingInput = z.input<typeof bookingSchema>
export type Booking = z.output<typeof bookingSchema>
