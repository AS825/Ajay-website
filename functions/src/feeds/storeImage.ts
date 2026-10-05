import { getDownloadURL, getStorage } from 'firebase-admin/storage'

/**
 * Copies a remote image (YouTube thumbnail, Instagram CDN – whose URLs expire)
 * into our Storage once and returns its public download URL. Visitors then
 * load images from our own domain/bucket only (privacy, SPEC §14).
 */
export async function storeRemoteImage(sourceUrl: string, path: string): Promise<string> {
  const file = getStorage().bucket().file(`media/images/feeds/${path}`)
  const [exists] = await file.exists()
  if (!exists) {
    const res = await fetch(sourceUrl, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) throw new Error(`Image ${sourceUrl}: HTTP ${res.status}`)
    const type = res.headers.get('content-type') ?? 'image/jpeg'
    if (!type.startsWith('image/')) throw new Error(`Image ${sourceUrl}: not an image (${type})`)
    await file.save(Buffer.from(await res.arrayBuffer()), {
      contentType: type,
      metadata: { cacheControl: 'public, max-age=31536000, immutable' },
      resumable: false,
    })
  }
  return getDownloadURL(file)
}
