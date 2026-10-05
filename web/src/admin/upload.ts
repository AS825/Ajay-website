import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { storage } from './firebase'

export type MediaKind = 'images' | 'videos' | 'docs'

export interface ImageOptions {
  /** Longest edge in px. */
  maxSize?: number
  /** Crop to this aspect ratio (width / height), centered, e.g. 4/5 for flyers. */
  aspect?: number
  quality?: number
}

/**
 * Compresses (and optionally center-crops) an image in the browser before
 * upload: WebP, max 2000px by default. SVG/GIF are uploaded as-is.
 */
export async function compressImage(file: File, opts: ImageOptions = {}): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) return file
  const { maxSize = 2000, aspect, quality = 0.82 } = opts
  const bitmap = await createImageBitmap(file)
  let sx = 0
  let sy = 0
  let sw = bitmap.width
  let sh = bitmap.height
  if (aspect) {
    if (sw / sh > aspect) {
      sw = Math.round(sh * aspect)
      sx = Math.round((bitmap.width - sw) / 2)
    } else {
      sh = Math.round(sw / aspect)
      sy = Math.round((bitmap.height - sh) / 2)
    }
  }
  const scale = Math.min(1, maxSize / Math.max(sw, sh))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(sw * scale)
  canvas.height = Math.round(sh * scale)
  canvas.getContext('2d')!.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', quality))
  return blob ?? file
}

const EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/svg+xml': 'svg',
  'image/gif': 'gif',
  'image/avif': 'avif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'application/pdf': 'pdf',
}

/** Uploads to media/<kind>/<folder>/<random>.<ext> and returns the public download URL. */
export function uploadMedia(
  blob: Blob,
  kind: MediaKind,
  folder: string,
  onProgress?: (fraction: number) => void,
): Promise<string> {
  const type = blob.type || 'application/octet-stream'
  const name = `${crypto.randomUUID()}.${EXT[type] ?? 'bin'}`
  const task = uploadBytesResumable(ref(storage, `media/${kind}/${folder}/${name}`), blob, {
    contentType: type,
    cacheControl: 'public, max-age=31536000, immutable',
  })
  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (s) => onProgress?.(s.totalBytes ? s.bytesTransferred / s.totalBytes : 0),
      reject,
      () => getDownloadURL(task.snapshot.ref).then(resolve, reject),
    )
  })
}

/** Best-effort removal of a file we uploaded (ignores foreign URLs and missing files). */
export async function deleteMedia(url: string) {
  if (!url.includes('/o/media%2F') && !url.includes('/media/')) return
  try {
    await deleteObject(ref(storage, url))
  } catch {
    /* already gone or not ours */
  }
}
