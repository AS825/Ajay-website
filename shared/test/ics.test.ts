import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildIcs, googleCalendarUrl } from '../src/ics'
import { makeEvent } from './fixtures'

test('ics has UTC times, escaping and CRLF', () => {
  const e = makeEvent()
  const ics = buildIcs(
    { ...e, description: 'Hi, there; ok\nnext' },
    'https://ajay.at/events/test-night',
    new Date('2026-10-01T00:00:00Z'),
  )
  assert.ok(ics.includes('DTSTART:20261015T200000Z\r\n'))
  assert.ok(ics.includes('DTEND:20261016T020000Z\r\n'))
  assert.ok(ics.includes('UID:test-night@ajay.at'))
  assert.ok(ics.includes('LOCATION:Club X\\, Gürtel 1\\, 1090 Wien'))
  assert.ok(ics.includes('DESCRIPTION:Hi\\, there\\; ok\\nnext'))
  assert.ok(ics.endsWith('END:VCALENDAR\r\n'))
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line)
})

test('google calendar link', () => {
  const url = new URL(googleCalendarUrl({ ...makeEvent(), description: 'x' }, 'https://ajay.at/e'))
  assert.equal(url.searchParams.get('dates'), '20261015T200000Z/20261016T020000Z')
  assert.equal(url.searchParams.get('text'), 'Test Night')
})
