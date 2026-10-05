import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ImagePlus, X } from 'lucide-react'
import { compressImage, uploadMedia } from '../upload'
import { Label } from './Kit'
import { toast } from './Toast'

/** Multiple photos (about / press): add several at once, remove individually. */
export function ImageList({
  label,
  value,
  onChange,
  folder,
  max = 12,
}: {
  label: string
  value: string[]
  onChange: (v: string[]) => void
  folder: string
  max?: number
}) {
  const { t } = useTranslation()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(0)

  const add = async (files: FileList | null) => {
    if (!files?.length) return
    const picked = Array.from(files).slice(0, max - value.length)
    setBusy(picked.length)
    const urls: string[] = []
    for (const f of picked) {
      try {
        urls.push(await uploadMedia(await compressImage(f, { maxSize: 2400 }), 'images', folder))
      } catch {
        toast(t('admin.media.failed'), 'error')
      }
      setBusy((n) => n - 1)
    }
    onChange([...value, ...urls])
    if (input.current) input.current.value = ''
  }

  return (
    <div>
      <Label>{label}</Label>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((url, i) => (
          <li
            key={url}
            className="relative aspect-square overflow-hidden rounded-[14px] border border-hairline"
          >
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 grid size-8 place-items-center rounded-full bg-black/70"
              aria-label={`${t('admin.media.remove')} ${i + 1}`}
            >
              <X className="size-4" />
            </button>
          </li>
        ))}
        {value.length < max && (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy > 0}
              className="grid aspect-square w-full place-items-center rounded-[14px] border border-dashed border-white/20 text-white/50 hover:text-white"
              aria-label={t('admin.media.addPhotos')}
            >
              {busy > 0 ? (
                <span className="text-xs">{t('admin.media.uploading', { count: busy })}</span>
              ) : (
                <ImagePlus className="size-6" />
              )}
            </button>
          </li>
        )}
      </ul>
      <input
        ref={input}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => add(e.target.files)}
      />
    </div>
  )
}
