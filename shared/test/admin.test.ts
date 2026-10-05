import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dateToViennaLocal, slugify, toCsv, viennaLocalToDate } from '../src/admin'

test('Vienna wall clock ↔ UTC, summer and winter time', () => {
  assert.equal(viennaLocalToDate('2026-10-15T22:00').toISOString(), '2026-10-15T20:00:00.000Z') // CEST
  assert.equal(viennaLocalToDate('2026-12-31T23:00').toISOString(), '2026-12-31T22:00:00.000Z') // CET
  assert.equal(dateToViennaLocal(new Date('2026-10-15T20:00:00Z')), '2026-10-15T22:00')
  assert.equal(dateToViennaLocal(new Date('2026-12-31T22:00:00Z')), '2026-12-31T23:00')
  // Day of the switch back (25 Oct 2026): 04:00 local is already CET.
  assert.equal(viennaLocalToDate('2026-10-25T04:00').toISOString(), '2026-10-25T03:00:00.000Z')
  for (const s of ['2026-03-29T12:00', '2026-07-01T00:30', '2026-11-11T11:11']) {
    assert.equal(dateToViennaLocal(viennaLocalToDate(s)), s)
  }
})

test('slugify', () => {
  assert.equal(slugify('LECTION #16 – Größte Nacht!'), 'lection-16-groesste-nacht')
  assert.equal(slugify('  Café Olé  '), 'cafe-ole')
})

test('csv quoting, BOM and formula guard', () => {
  const csv = toCsv([
    ['Name', 'Note'],
    ['Huber, Lena', 'say "hi"'],
    ['=HYPERLINK("x")', 3],
  ])
  assert.ok(csv.startsWith('﻿'))
  assert.ok(csv.includes('"Huber, Lena","say ""hi"""'))
  assert.ok(csv.includes(`"'=HYPERLINK(""x"")",3`))
})
