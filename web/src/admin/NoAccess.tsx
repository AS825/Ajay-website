import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { signOut, type User } from 'firebase/auth'
import { auth } from './firebase'
import { callFunction } from '../lib/callable'
import { buttonClass } from '../components/ui/Button'

/**
 * Signed in without the admin claim. Allow-listed people (ADMIN_EMAILS in
 * functions/.env) activate their access here themselves.
 */
export function NoAccess({ user }: { user: User }) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activate = async () => {
    setBusy(true)
    setError(null)
    try {
      await callFunction('claimAdmin', {})
      // New claim → force a fresh ID token; useAdminAuth picks it up.
      await user.getIdToken(true)
    } catch (err) {
      const reason = (err as { details?: { reason?: string } }).details?.reason
      setError(reason === 'notAllowed' ? t('admin.auth.notAllowed') : t('admin.common.error'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-[100svh] place-items-center p-6 text-center">
      <div className="max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">{t('admin.auth.noAccessTitle')}</h1>
        <p className="text-sm text-muted">{t('admin.auth.noAccessText', { email: user.email })}</p>
        <button
          type="button"
          onClick={activate}
          disabled={busy}
          className={buttonClass('primary', 'w-full')}
        >
          {busy ? t('admin.common.saving') : t('admin.auth.activate')}
        </button>
        {error && (
          <p
            role="alert"
            className="rounded-[16px] border border-accent/40 bg-accent/10 p-3 text-sm"
          >
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => signOut(auth)}
          className={buttonClass('glass', 'w-full')}
        >
          {t('admin.auth.signOut')}
        </button>
      </div>
    </div>
  )
}
