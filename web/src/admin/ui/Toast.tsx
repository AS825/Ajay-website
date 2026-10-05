import { useSyncExternalStore } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { spring } from '../../lib/motion'

type Toast = { id: number; text: string; tone: 'ok' | 'error' }
let toasts: Toast[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function toast(text: string, tone: Toast['tone'] = 'ok') {
  const id = Date.now() + Math.random()
  toasts = [...toasts, { id, text, tone }]
  emit()
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id)
    emit()
  }, 3200)
}

export function Toaster() {
  const list = useSyncExternalStore(
    (l) => (listeners.add(l), () => listeners.delete(l)),
    () => toasts,
  )
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex flex-col items-center gap-2 px-4"
      style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
      aria-live="polite"
    >
      <AnimatePresence>
        {list.map((t) => (
          <m.div
            key={t.id}
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={spring}
            className={`glass rounded-full px-5 py-3 text-sm font-semibold shadow-soft ${t.tone === 'error' ? 'border-accent text-white' : ''}`}
            role={t.tone === 'error' ? 'alert' : 'status'}
          >
            {t.tone === 'error' ? '⚠︎ ' : '✓ '}
            {t.text}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
