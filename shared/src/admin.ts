import { EVENT_TIME_ZONE } from './utils'

/** Offset of Europe/Vienna from UTC at a given instant, in minutes (60 or 120). */
function viennaOffsetMinutes(at: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EVENT_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return Math.round((asUtc - at.getTime()) / 60000)
}

/**
 * "2026-10-15T22:00" (wall clock in Vienna) → Date. Independent of the
 * browser's timezone, so the admin works correctly from anywhere.
 */
export function viennaLocalToDate(local: string): Date {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) throw new Error(`Invalid local datetime: ${local}`)
  const [, y, mo, d, h, mi] = m.map(Number) as [number, number, number, number, number, number]
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  // Two passes handle the DST switch correctly.
  let ts = guess - viennaOffsetMinutes(new Date(guess)) * 60000
  ts = guess - viennaOffsetMinutes(new Date(ts)) * 60000
  return new Date(ts)
}

/** Date → "2026-10-15T22:00" in Vienna wall-clock time (for datetime-local inputs). */
export function dateToViennaLocal(date: Date): string {
  const shifted = new Date(date.getTime() + viennaOffsetMinutes(date) * 60000)
  return shifted.toISOString().slice(0, 16)
}

/** URL slug from a title: lowercase ASCII, umlauts transliterated. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

/** RFC 4180 CSV with BOM (Excel opens UTF-8 correctly) and `;`-safe quoting. */
export function toCsv(rows: (string | number | boolean | null | undefined)[][]): string {
  const cell = (v: string | number | boolean | null | undefined) => {
    const s = v === null || v === undefined ? '' : String(v)
    // Prevent formula injection when opened in Excel.
    const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s
    return /[",;\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
  }
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n'
}
