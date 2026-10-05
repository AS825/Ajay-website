import { useTranslation } from 'react-i18next'
import { AnimatePresence, m } from 'motion/react'
import { spring } from '../../lib/motion'
import { buttonClass } from '../../components/ui/Button'

/** Sticky save bar that slides in when there are unsaved changes. */
export function SaveBar({
  dirty,
  saving,
  onSave,
  onReset,
  saveLabel,
}: {
  dirty: boolean
  saving: boolean
  onSave: () => void
  onReset?: () => void
  saveLabel?: string
}) {
  const { t } = useTranslation()
  return (
    <AnimatePresence>
      {(dirty || saving) && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={spring}
          className="fixed inset-x-0 bottom-[calc(4.5rem+var(--safe-bottom))] z-40 flex justify-center px-4 md:bottom-6 md:left-60"
        >
          <div className="glass flex w-full max-w-xl items-center gap-2 rounded-full bg-[rgb(18_18_20/0.85)] py-2 pr-2 pl-5 shadow-soft">
            <span className="flex-1 text-sm text-white/80">{t('admin.common.unsaved')}</span>
            {onReset && (
              <button
                type="button"
                onClick={onReset}
                disabled={saving}
                className={buttonClass('glass', '', 'sm')}
              >
                {t('admin.common.discard')}
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className={buttonClass('primary', '', 'sm')}
            >
              {saving ? t('admin.common.saving') : (saveLabel ?? t('admin.common.save'))}
            </button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
