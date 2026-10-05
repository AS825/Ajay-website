import { test } from 'node:test'
import assert from 'node:assert/strict'
import { injectEventMeta } from '../src/meta'
import { makeEvent } from './fixtures'

const html = `<!doctype html><html><head>
    <title>AJAY ADAM</title>
    <meta name="description" content="site" />
    <meta property="og:title" content="site" />
    <meta name="twitter:card" content="summary" />
  </head><body><div id="root"></div></body></html>`

test('replaces title/description/og and adds JSON-LD', () => {
  const e = makeEvent({ flyerUrl: 'https://cdn.example/flyer.jpg' })
  const out = injectEventMeta(html, e, {
    url: 'https://ajay.at/events/test-night',
    artistName: 'AJAY ADAM',
    dateLabel: '15 Oct 2026',
  })
  assert.equal(out.match(/<title>/g)?.length, 1)
  assert.equal(out.match(/name="description"/g)?.length, 1)
  assert.equal(out.match(/property="og:title"/g)?.length, 1)
  assert.equal(out.match(/name="twitter:card"/g)?.length, 1)
  assert.ok(out.includes('<title>Test Night — 15 Oct 2026 · Club X</title>'))
  assert.ok(out.includes('content="https://cdn.example/flyer.jpg"'))
  assert.ok(out.includes('summary_large_image'))
  // Attribute escaping and no raw "<" inside the JSON-LD script.
  assert.ok(out.includes('with &quot;vibes&quot;; and &lt;tags&gt;.'))
  const ld = out.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1] ?? ''
  assert.ok(!ld.includes('<'))
  const data = JSON.parse(ld)
  assert.equal(data['@type'], 'MusicEvent')
  assert.equal(data.startDate, '2026-10-15T20:00:00.000Z')
  assert.equal(data.location.name, 'Club X')
  assert.ok(out.includes('<div id="root"></div>'))
})
