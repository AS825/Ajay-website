export type ShareResult = 'shared' | 'copied' | 'cancelled' | 'failed'

/** Web Share API with clipboard fallback (SPEC §6). */
export async function shareOrCopy(data: {
  title: string
  text?: string
  url: string
}): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled'
      // Fall through to copy (e.g. share not allowed in this context).
    }
  }
  try {
    await navigator.clipboard.writeText(data.url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
