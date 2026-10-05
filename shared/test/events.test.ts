import { test } from 'node:test'
import assert from 'node:assert/strict'
import { appleMapsUrl, eventState, googleMapsUrl } from '../src/events'
import { makeEvent } from './fixtures'

const before = new Date('2026-10-10T12:00:00Z')

test('guestlist open / full / closed / disabled', () => {
  assert.equal(eventState(makeEvent(), before).guestlist, 'open')
  const full = makeEvent({
    guestlist: { enabled: true, capacity: 10, deadline: null, maxPlusOnes: 0, count: 10 },
  })
  assert.equal(eventState(full, before).guestlist, 'full')
  const late = makeEvent({
    guestlist: {
      enabled: true,
      capacity: 10,
      deadline: new Date('2026-10-09T00:00:00Z'),
      maxPlusOnes: 0,
      count: 0,
    },
  })
  assert.equal(eventState(late, before).guestlist, 'closed')
  const off = makeEvent({
    guestlist: { enabled: false, capacity: 0, deadline: null, maxPlusOnes: 0, count: 0 },
  })
  assert.equal(eventState(off, before).guestlist, 'disabled')
})

test('live and past', () => {
  const e = makeEvent({ ticketing: { enabled: false, externalUrl: 'https://t.example' } })
  assert.deepEqual(eventState(e, new Date('2026-10-15T22:00:00Z')), {
    isPast: false,
    isLive: true,
    guestlist: 'open',
    externalTickets: true,
  })
  const past = eventState(e, new Date('2026-10-17T00:00:00Z'))
  assert.equal(past.isPast, true)
  assert.equal(past.guestlist, 'disabled')
  assert.equal(past.externalTickets, false)
})

test('maps links', () => {
  const v = makeEvent().venue
  assert.match(
    googleMapsUrl(v),
    /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=Club%20X%2C%20G%C3%BCrtel/,
  )
  assert.equal(
    googleMapsUrl({ ...v, mapsUrl: 'https://maps.app.goo.gl/x' }),
    'https://maps.app.goo.gl/x',
  )
  assert.match(appleMapsUrl(v), /^https:\/\/maps\.apple\.com\/\?q=Club%20X/)
})

test('normalizeSections inserts new sections after their predecessor', async () => {
  const { normalizeSections } = await import('../src/seed')
  const stored = [
    { id: 'events' as const, visible: true },
    { id: 'sets' as const, visible: false },
    { id: 'marquee' as const, visible: true },
  ]
  const out = normalizeSections(stored)
  assert.deepEqual(
    out.map((s) => s.id),
    [
      'events',
      'tiles',
      'music',
      'sets',
      'instagram',
      'drops',
      'about',
      'booking',
      'support',
      'marquee',
    ],
  )
  assert.equal(out.find((s) => s.id === 'sets')?.visible, false)
  assert.equal(out.length, 10)
})
