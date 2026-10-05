import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parsePassUrl, passUrl } from '../src/pass'

test('pass URL round trip', () => {
  const ref = { eventId: 'ev1', entryId: 'abc123', token: 'tok_-9Z' }
  const url = passUrl('https://ajay.at/', ref)
  assert.equal(url, 'https://ajay.at/pass/ev1/abc123?t=tok_-9Z')
  assert.deepEqual(parsePassUrl(`  ${url}\n`), ref)
  assert.deepEqual(parsePassUrl('http://localhost:5173/pass/ev1/abc123?t=tok_-9Z'), ref)
})

test('rejects other codes', () => {
  assert.equal(parsePassUrl('https://ajay.at/events/x'), null)
  assert.equal(parsePassUrl('https://ajay.at/pass/ev1/abc123'), null)
  assert.equal(parsePassUrl('hello'), null)
})
