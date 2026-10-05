import { useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, ImagePlus, Trash2, Upload } from 'lucide-react'
import { compressImage, uploadMedia, type ImageOptions, type MediaKind } from '../upload'
import { buttonClass } from '../../components/ui/Button'
import { Label } from './Kit'
import { toast } from './Toast'

const ACCEPT: Record<MediaKind, string> = {
  images: 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/svg+xml',
  videos: 'video/mp4,video/webm,video/quicktime',
  docs: 'application/pdf',
}
const LIMIT_MB: Record<MediaKind, number> = { images: 10, videos: 30, docs: 20 }

/** Upload field with preview for images, videos and PDFs (compresses images first). */
export function MediaField({
  label,
  value,
  onChange,
  kind = 'images',
  folder,
  image,
  aspect = 'aspect-video',
  hint,
}: {
  label: string
  value: string
  onChange: (url: string) => void
  kind?: MediaKind
  folder: string
  image?: ImageOptions
  aspect?: string
  hint?: string
}) {
  const { t } = useTranslation()
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    try {
      setProgress(0)
      const blob = kind === 'images' ? await compressImage(file, image) : file
      if (blob.size > LIMIT_MB[kind] * 1024 * 1024) {
        toast(t('admin.media.tooLarge', { mb: LIMIT_MB[kind] }), 'error')
        return
      }
      if (kind === 'videos' && blob.size > 3 * 1024 * 1024)
        toast(t('admin.media.videoHeavy'), 'error')
      onChange(await uploadMedia(blob, kind, folder, setProgress))
    } catch (err) {
      console.error(err)
      toast(t('admin.media.failed'), 'error')
    } finally {
      setProgress(null)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <div className="flex items-start gap-3">
        <div
          className={`relative w-32 shrink-0 overflow-hidden rounded-[16px] border border-hairline bg-white/[0.04] ${aspect}`}
        >
          {value && kind === 'images' && (
            <img src={value} alt="" className="size-full object-cover" />
          )}
          {value && kind === 'videos' && (
            <video src={value} className="size-full object-cover" muted playsInline />
          )}
          {value && kind === 'docs' && (
            <FileText className="absolute inset-0 m-auto size-8 text-white/60" aria-hidden="true" />
          )}
          {!value && (
            <ImagePlus
              className="absolute inset-0 m-auto size-6 text-white/30"
              aria-hidden="true"
            />
          )}
          {progress !== null && (
            <div className="absolute inset-0 grid place-items-center bg-black/60 text-xs font-bold tabular-nums">
              {Math.round(progress * 100)}%
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            id={id}
            ref={input}
            type="file"
            accept={ACCEPT[kind]}
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={progress !== null}
            className={buttonClass('glass', '', 'sm')}
          >
            <Upload className="size-4" aria-hidden="true" />{' '}
            {value ? t('admin.media.replace') : t('admin.media.upload')}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange('')}
              className={buttonClass('outline', '', 'sm')}
            >
              <Trash2 className="size-4" aria-hidden="true" /> {t('admin.media.remove')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
