import { useEffect, useId, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, m, useDragControls, type PanInfo } from 'motion/react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { spring } from '../../lib/motion'
import { useMediaQuery } from '../../lib/hooks'
import { useScrollLock } from '../../lib/smoothScroll'

/**
 * Bottom sheet on mobile (drag the handle down to dismiss), centered modal
 * on desktop (SPEC §3/§6). Escape and backdrop tap close it.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  const { t } = useTranslation()
  const desktop = useMediaQuery('(min-width: 768px)')
  const drag = useDragControls()
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  useScrollLock(open)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus()
    }
  }, [open, onClose])

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onClose()
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center md:items-center md:p-6">
          <m.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <m.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="glass relative max-h-[92svh] w-full overflow-y-auto overscroll-contain rounded-t-[var(--radius-sheet)] bg-[rgb(18_18_20/0.88)] shadow-soft outline-none md:max-w-lg md:rounded-[var(--radius-sheet)]"
            style={{ paddingBottom: 'calc(1.5rem + var(--safe-bottom))' }}
            data-lenis-prevent
            initial={desktop ? { opacity: 0, scale: 0.94, y: 12 } : { y: '100%' }}
            animate={desktop ? { opacity: 1, scale: 1, y: 0 } : { y: 0 }}
            exit={desktop ? { opacity: 0, scale: 0.96, y: 8 } : { y: '100%' }}
            transition={spring}
            drag={desktop ? false : 'y'}
            dragListener={false}
            dragControls={drag}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.9 }}
            onDragEnd={onDragEnd}
          >
            {!desktop && (
              <div
                className="flex h-8 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
                onPointerDown={(e) => drag.start(e)}
                aria-hidden="true"
              >
                <span className="h-1.5 w-10 rounded-full bg-white/30" />
              </div>
            )}
            <div className="flex items-start justify-between gap-4 px-6 pt-2 pb-4 md:pt-6">
              <h2 id={titleId} className="text-2xl font-bold tracking-tight">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="pressable -mt-1 -mr-2 grid size-11 shrink-0 place-items-center rounded-full bg-white/10"
                aria-label={t('common.close')}
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="px-6">{children}</div>
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
