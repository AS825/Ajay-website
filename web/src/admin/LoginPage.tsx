import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
} from 'firebase/auth'
import { auth } from './firebase'
import { useEmulators } from '../lib/firebase'
import { controlClass } from '../components/form/Field'
import { buttonClass } from '../components/ui/Button'
import { toast } from './ui/Toast'

export function LoginPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
    } catch (err) {
      const code = (err as { code?: string }).code ?? ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') return
      setError(
        [
          'auth/invalid-credential',
          'auth/wrong-password',
          'auth/user-not-found',
          'auth/invalid-email',
        ].includes(code)
          ? 'admin.auth.wrongCredentials'
          : code === 'auth/too-many-requests'
            ? 'admin.auth.tooMany'
            : 'admin.auth.failed',
      )
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    void run(() => signInWithEmailAndPassword(auth, email.trim(), password))
  }

  return (
    <div
      className="grid min-h-[100svh] place-items-center px-4"
      style={{ paddingTop: 'var(--safe-top)' }}
    >
      <div className="w-full max-w-sm">
        <p className="mb-8 text-center text-3xl font-extrabold tracking-tight">
          AJAY<span className="text-accent">.</span>{' '}
          <span className="font-medium text-white/50">Admin</span>
        </p>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-[var(--radius-sheet)] border border-hairline bg-white/[0.03] p-6"
        >
          <h1 className="text-xl font-bold">{t('admin.auth.title')}</h1>
          <div>
            <label htmlFor="login-email" className="mb-2 block text-sm text-white/80">
              {t('admin.auth.email')}
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={controlClass}
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-2 block text-sm text-white/80">
              {t('admin.auth.password')}
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={controlClass}
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-[16px] border border-accent/40 bg-accent/10 p-3 text-sm"
            >
              {t(error)}
            </p>
          )}
          <button type="submit" disabled={busy} className={buttonClass('primary', 'w-full')}>
            {t('admin.auth.signIn')}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => signInWithPopup(auth, new GoogleAuthProvider()))}
            className={buttonClass('glass', 'w-full')}
          >
            {t('admin.auth.google')}
          </button>
          <button
            type="button"
            className="w-full py-2 text-center text-xs text-white/50 underline-offset-2 hover:underline"
            onClick={() => {
              if (!email) return setError('admin.auth.enterEmailFirst')
              void run(async () => {
                await sendPasswordResetEmail(auth, email.trim())
                toast(t('admin.auth.resetSent'))
              })
            }}
          >
            {t('admin.auth.forgot')}
          </button>
        </form>
        {useEmulators && (
          <p className="mt-4 text-center text-xs text-white/40">
            {t('admin.auth.devHint')} <code>admin@ajay.local</code> / <code>ajay-admin</code>
          </p>
        )}
      </div>
    </div>
  )
}
