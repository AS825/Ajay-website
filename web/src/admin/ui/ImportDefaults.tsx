import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { doc, writeBatch } from 'firebase/firestore'
import { Download } from 'lucide-react'
import { seedLinks, seedSite, seedTheme } from '@ajay/shared'
import { adminDb } from '../firebase'
import { useCollectionData, useDocData } from '../hooks'
import { buttonClass } from '../../components/ui/Button'
import { Card } from './Kit'
import { toast } from './Toast'

/**
 * Fresh production project: offers to import the starting content (links from
 * the Linktree, texts, theme – SPEC §5). Existing documents are never overwritten;
 * placeholder events are not imported.
 */
export function ImportDefaults() {
  const { t } = useTranslation()
  const site = useDocData('settings/site')
  const theme = useDocData('settings/theme')
  const links = useCollectionData('links')
  const [busy, setBusy] = useState(false)

  if (site === undefined || theme === undefined || links === undefined) return null
  const missing = !site || !theme || links.length === 0
  if (!missing) return null

  const run = async () => {
    setBusy(true)
    try {
      const batch = writeBatch(adminDb)
      if (!site) batch.set(doc(adminDb, 'settings/site'), seedSite)
      if (!theme) batch.set(doc(adminDb, 'settings/theme'), seedTheme)
      if (links.length === 0)
        for (const [id, l] of Object.entries(seedLinks)) batch.set(doc(adminDb, 'links', id), l)
      await batch.commit()
      toast(t('admin.import.done'))
    } catch (err) {
      console.error(err)
      toast(t('admin.common.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card title={t('admin.import.title')} className="mb-6 border-accent/40">
      <p className="mb-4 text-sm text-white/80">{t('admin.import.text')}</p>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className={buttonClass('primary', '', 'sm')}
      >
        <Download className="size-4" aria-hidden="true" /> {t('admin.import.button')}
      </button>
    </Card>
  )
}
