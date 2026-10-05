import { HttpsError } from 'firebase-functions/v2/https'
import type { z } from 'zod'

/** Parses callable input with a shared zod schema; invalid input → invalid-argument. */
export function parseOrThrow<S extends z.ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new HttpsError('invalid-argument', 'Invalid input.', {
      reason: 'invalid',
      fields: result.error.issues.map((i) => i.path.join('.')),
    })
  }
  return result.data
}
