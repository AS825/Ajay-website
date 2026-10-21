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
    externalGuestlist: false,
    externalTickets: true,
  })
  const past = eventState(e, new Date('2026-10-17T00:00:00Z'))
  assert.equal(past.isPast, true)
  assert.equal(past.guestlist, 'disabled')
  assert.equal(past.externalTickets, false)
  const ext = eventState(
    { ...e, guestlist: { ...e.guestlist, externalUrl: 'https://getguestlist.io/x' } },
    new Date('2026-10-15T20:00:00Z'),
  )
  assert.equal(ext.externalGuestlist, true)
  assert.equal(ext.guestlist, 'disabled')
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
  const out = normalizeSections([
    { id: 'about', visible: true },
    { id: 'venues', visible: false },
  ])
  assert.deepEqual(
    out.map((s) => s.id),
    [
      'events',
      'about',
      'info',
      'stats',
      'venues',
      'artists',
      'produced',
      'rider',
      'livesets',
      'contact',
    ],
  )
  assert.equal(out.find((s) => s.id === 'venues')?.visible, false)
})

test('normalizeSections moves events up for the first press-kit order', async () => {
  const { normalizeSections } = await import('../src/seed')
  const ids = [
    'about',
    'info',
    'stats',
    'venues',
    'rider',
    'livesets',
    'events',
    'contact',
  ] as const
  const out = normalizeSections(ids.map((id) => ({ id, visible: id !== 'stats' })))
  assert.equal(out[0]?.id, 'events')
  assert.equal(out.find((s) => s.id === 'stats')?.visible, false)
})

test('normalizeSections resets lists from the old layout to the press-kit order', async () => {
  const { normalizeSections, seedSite } = await import('../src/seed')
  const out = normalizeSections([
    { id: 'marquee' as never, visible: true },
    { id: 'events', visible: false },
    { id: 'about', visible: true },
  ])
  assert.deepEqual(
    out.map((s) => s.id),
    seedSite.sections.map((s) => s.id),
  )
  assert.equal(out.find((s) => s.id === 'events')?.visible, false)
})
