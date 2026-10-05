import { test } from 'node:test'
import assert from 'node:assert/strict'
import { channelIdsFromUrls, parseYouTubeFeed } from '../src/feeds/youtube'
import { ytFeed } from './fixtures'

test('parses entries, decodes entities and CDATA', () => {
  const xml = ytFeed('AJAY &amp; Friends', [
    {
      id: 'abc123def45',
      title: 'LECTION #16 &amp; &quot;Live&quot;',
      published: '2026-10-01T18:00:00+00:00',
    },
    { id: 'xyz987uvw65', title: '<![CDATA[Edit <3]]>', published: '2026-09-01T18:00:00+00:00' },
  ])
  const items = parseYouTubeFeed(xml)
  assert.equal(items.length, 2)
  assert.deepEqual(items[0], {
    id: 'abc123def45',
    title: 'LECTION #16 & "Live"',
    publishedAt: '2026-10-01T18:00:00+00:00',
    channelTitle: 'AJAY & Friends',
  })
  assert.equal(items[1]!.title, 'Edit <3')
})

test('channel ids from link URLs', () => {
  assert.deepEqual(
    channelIdsFromUrls([
      'https://www.youtube.com/channel/UCbarwFBxhndGVWTjlznesKg',
      'https://www.youtube.com/channel/UCga2Gfg9z_rMUor-uY7Vsog?sub=1',
      'https://www.youtube.com/watch?v=68r066j96Mg',
      'https://www.youtube.com/channel/UCbarwFBxhndGVWTjlznesKg',
    ]),
    ['UCbarwFBxhndGVWTjlznesKg', 'UCga2Gfg9z_rMUor-uY7Vsog'],
  )
})
