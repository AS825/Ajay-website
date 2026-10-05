export const ytFeed = (
  channel: string,
  videos: { id: string; title: string; published: string }[],
) => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>${channel}</title>
 <author><name>${channel}</name><uri>https://www.youtube.com/channel/x</uri></author>
${videos
  .map(
    (v) => ` <entry>
  <id>yt:video:${v.id}</id>
  <yt:videoId>${v.id}</yt:videoId>
  <title>${v.title}</title>
  <published>${v.published}</published>
  <media:group><media:title>${v.title}</media:title><media:thumbnail url="https://i1.ytimg.com/vi/${v.id}/hqdefault.jpg" width="480" height="360"/></media:group>
 </entry>`,
  )
  .join('\n')}
</feed>`

/** 1×1 PNG */
export const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)
