import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { doc, runTransaction, serverTimestamp, where, type Timestamp } from 'firebase/firestore'
import { AnimatePresence, m } from 'motion/react'
import { CheckCircle2, Clock, List, X, XCircle } from 'lucide-react'
import jsQR from 'jsqr'
import { EVENT_TIME_ZONE, parsePassUrl } from '@ajay/shared'
import { adminDb } from '../firebase'
import { useCollectionData, useDocData } from '../hooks'
import type { AdminEvent, GuestEntry } from '../types'
import { springBouncy } from '../../lib/motion'
import { useLang } from '../../i18n'

type Outcome =
  | { kind: 'ok'; name: string; plusOnes: number }
  | { kind: 'already'; name: string; plusOnes: number; at: string }
  | { kind: 'waitlist'; name: string }
  | { kind: 'wrongEvent' }
  | { kind: 'invalid' }

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>
}

const SCAN_INTERVAL_MS = 160
const SAME_CODE_PAUSE_MS = 3000
const RESULT_MS = 2600

/**
 * Door check-in (SPEC §10.7): camera QR scanner with big green/red feedback
 * and protection against double entry (transaction on the guestlist entry).
 */
export default function Scanner() {
  const { id = '' } = useParams()
  const { t } = useTranslation()
  const { lang } = useLang()
  const event = useDocData<AdminEvent>(`events/${id}`)
  const confirmed = useCollectionData<GuestEntry>(
    `events/${id}/guestlist`,
    [where('status', '==', 'confirmed')],
    'confirmed',
  )
  const video = useRef<HTMLVideoElement>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const busy = useRef(false)
  const last = useRef<{ text: string; at: number }>({ text: '', at: 0 })

  const people = (list: GuestEntry[] | undefined, pred: (g: GuestEntry) => boolean) =>
    (list ?? []).filter(pred).reduce((n, g) => n + 1 + g.plusOnes, 0)
  const inCount = people(confirmed, (g) => g.checkedIn)
  const total = people(confirmed, () => true)

  const checkIn = useCallback(
    async (text: string): Promise<Outcome> => {
      const ref = parsePassUrl(text)
      if (!ref) return { kind: 'invalid' }
      if (ref.eventId !== id) return { kind: 'wrongEvent' }
      const entryRef = doc(adminDb, 'events', id, 'guestlist', ref.entryId)
      return runTransaction(adminDb, async (tx): Promise<Outcome> => {
        const snap = await tx.get(entryRef)
        const g = snap.data() as (GuestEntry & { qrToken?: string }) | undefined
        if (!g || g.qrToken !== ref.token) return { kind: 'invalid' }
        const name = `${g.firstName} ${g.lastName}`
        if (g.status !== 'confirmed') return { kind: 'waitlist', name }
        if (g.checkedIn) {
          const at = (g.checkedInAt as Timestamp | null | undefined)?.toDate()
          return {
            kind: 'already',
            name,
            plusOnes: g.plusOnes,
            at: at
              ? at.toLocaleTimeString(lang === 'de' ? 'de-AT' : 'en-GB', {
                  timeZone: EVENT_TIME_ZONE,
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '–',
          }
        }
        tx.update(entryRef, { checkedIn: true, checkedInAt: serverTimestamp() })
        return { kind: 'ok', name, plusOnes: g.plusOnes }
      })
    },
    [id, lang],
  )

  const handle = useCallback(
    async (text: string) => {
      const now = Date.now()
      if (
        busy.current ||
        (text === last.current.text && now - last.current.at < SAME_CODE_PAUSE_MS)
      )
        return
      busy.current = true
      last.current = { text, at: now }
      let result: Outcome
      try {
        result = await checkIn(text)
      } catch (err) {
        console.error(err)
        result = { kind: 'invalid' }
      }
      setOutcome(result)
      navigator.vibrate?.(result.kind === 'ok' ? 80 : [60, 60, 60, 60, 160])
      setTimeout(() => {
        setOutcome(null)
        busy.current = false
      }, RESULT_MS)
    },
    [checkIn],
  )

  // Camera + decode loop.
  useEffect(() => {
    let stream: MediaStream | null = null
    let timer = 0
    let stopped = false
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const NativeDetector = (
      window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }
    ).BarcodeDetector
    const detector = NativeDetector ? new NativeDetector({ formats: ['qr_code'] }) : null

    const tick = async () => {
      const v = video.current
      if (stopped || !v || v.readyState < 2 || busy.current) return
      try {
        if (detector) {
          const codes = await detector.detect(v)
          if (codes[0]) void handle(codes[0].rawValue)
        } else if (ctx) {
          // Decode a centered square at reduced size – fast enough on phones.
          const size = Math.min(v.videoWidth, v.videoHeight)
          const target = Math.min(size, 640)
          canvas.width = canvas.height = target
          ctx.drawImage(
            v,
            (v.videoWidth - size) / 2,
            (v.videoHeight - size) / 2,
            size,
            size,
            0,
            0,
            target,
            target,
          )
          const code = jsQR(ctx.getImageData(0, 0, target, target).data, target, target, {
            inversionAttempts: 'dontInvert',
          })
          if (code?.data) void handle(code.data)
        }
      } catch {
        /* frame not ready */
      }
    }

    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })
        if (stopped) return stream.getTracks().forEach((tr) => tr.stop())
        if (video.current) {
          video.current.srcObject = stream
          await video.current.play()
        }
        timer = window.setInterval(tick, SCAN_INTERVAL_MS)
      } catch (err) {
        const name = (err as DOMException)?.name
        setCameraError(
          !window.isSecureContext || !navigator.mediaDevices
            ? t('admin.scan.needsHttps')
            : name === 'NotAllowedError'
              ? t('admin.scan.permission')
              : t('admin.scan.noCamera'),
        )
      }
    })()

    return () => {
      stopped = true
      window.clearInterval(timer)
      stream?.getTracks().forEach((tr) => tr.stop())
    }
  }, [handle, t])

  const tone =
    outcome?.kind === 'ok'
      ? 'bg-emerald-500 text-black'
      : outcome?.kind === 'already' || outcome?.kind === 'waitlist'
        ? 'bg-amber-400 text-black'
        : 'bg-red-600 text-white'

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black"
      style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}
    >
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{event?.title ?? '…'}</p>
          <p className="text-xs text-white/60 tabular-nums">
            {t('admin.scan.counter', { in: inCount, total })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/admin/events/${id}/guestlist`}
            className="grid size-11 place-items-center rounded-full bg-white/10"
            aria-label={t('admin.scan.manual')}
          >
            <List className="size-5" />
          </Link>
          <Link
            to={`/admin/events/${id}`}
            className="grid size-11 place-items-center rounded-full bg-white/10"
            aria-label={t('admin.common.close')}
          >
            <X className="size-5" />
          </Link>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <video
          ref={video}
          className="absolute inset-0 size-full object-cover"
          muted
          playsInline
          aria-label={t('admin.scan.camera')}
        />
        {!cameraError && (
          <div
            className="pointer-events-none absolute inset-0 grid place-items-center"
            aria-hidden="true"
          >
            <div className="aspect-square w-[70vmin] max-w-sm rounded-[32px] border-4 border-white/80 shadow-[0_0_0_9999px_rgb(0_0_0/0.45)]" />
          </div>
        )}
        {cameraError && (
          <p className="absolute inset-x-6 top-1/3 rounded-[20px] bg-white/10 p-5 text-center text-sm">
            {cameraError}
          </p>
        )}
        <p className="absolute inset-x-0 bottom-6 text-center text-sm text-white/80">
          {t('admin.scan.hint')}
        </p>

        <AnimatePresence>
          {outcome && (
            <m.button
              type="button"
              onClick={() => {
                setOutcome(null)
                busy.current = false
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={springBouncy}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center ${tone}`}
              role="alert"
            >
              {outcome.kind === 'ok' ? (
                <CheckCircle2 className="size-24" aria-hidden="true" />
              ) : outcome.kind === 'already' || outcome.kind === 'waitlist' ? (
                <Clock className="size-24" aria-hidden="true" />
              ) : (
                <XCircle className="size-24" aria-hidden="true" />
              )}
              <span className="text-4xl font-extrabold tracking-tight">
                {t(`admin.scan.result.${outcome.kind}`)}
              </span>
              {'name' in outcome && (
                <span className="text-2xl font-bold">
                  {outcome.name}
                  {'plusOnes' in outcome && outcome.plusOnes > 0 && ` +${outcome.plusOnes}`}
                </span>
              )}
              {outcome.kind === 'already' && (
                <span className="text-lg">{t('admin.scan.alreadyAt', { time: outcome.at })}</span>
              )}
              <span className="mt-6 text-sm opacity-70">{t('admin.scan.tapToContinue')}</span>
            </m.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
