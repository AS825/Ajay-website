import { dateToViennaLocal } from '@ajay/shared'

/**
 * Event flyers that ship with the site, named after the event day:
 * assets/flyers/2026-10-30.webp is used for every event starting on 30 Oct 2026.
 */
const FLYERS = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>('../assets/flyers/*.{webp,jpg,jpeg,png}', {
      eager: true,
      import: 'default',
    }),
  ).map(([path, url]) => [
    path
      .split('/')
      .pop()!
      .replace(/\.\w+$/, ''),
    url,
  ]),
)

export function bundledFlyer(startsAt: Date): string | undefined {
  return FLYERS[dateToViennaLocal(startsAt).slice(0, 10)]
}
