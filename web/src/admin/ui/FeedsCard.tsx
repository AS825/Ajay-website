import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { deleteDoc, doc, setDoc, Timestamp } from 'firebase/firestore'
import { RefreshCw } from 'lucide-react'
import type { FeedDoc, FeedPost, FeedVideo } from '@ajay/shared'
import { adminDb } from '../firebase'
import { useDocData } from '../hooks'
import { fmtDateTime } from '../format'
import { callFunction } from '../../lib/callable'
import { useLang } from '../../i18n'
import { buttonClass } from '../../components/ui/Button'
import { SocialIcon } from '../../components/ui/SocialIcon'
import { Card, TextField } from './Kit'
import { toast } from './Toast'

interface Summary {
  youtube: { channels: number; videos: number; error: string }
  instagram: { connected: boolean; posts: number; error: string }
}

function Status({
  updatedAt,
  error,
  count,
  label,
}: {
  updatedAt?: string | null
  error?: string
  count: number
  label: string
}) {
  const { t } = useTranslation()
  const { lang } = useLang()
  return (
    <p className="text-xs text-muted">
      {updatedAt
        ? t('admin.feeds.lastSync', { date: fmtDateTime(new Date(updatedAt), lang), count, label })
        : t('admin.feeds.never')}
      {error && <span className="mt-1 block text-amber-200">⚠︎ {error}</span>}
    </p>
  )
}

/**
 * Automatic content (YouTube uploads, Instagram posts). Syncs hourly in
 * production; "Sync now" runs it immediately (and is how it runs locally).
 */
export function FeedsCard() {
  const { t } = useTranslation()
  const yt = useDocData<FeedDoc<FeedVideo>>('feeds/youtube')
  const ig = useDocData<FeedDoc<FeedPost>>('feeds/instagram')
  const secret = useDocData<{ accessToken?: string; expiresAt?: Timestamp }>('secrets/instagram')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const connected = !!secret?.accessToken

  const sync = async () => {
    setBusy(true)
    try {
      const s = await callFunction<Record<string, never>, Summary>('syncFeeds', {})
      const errors = [s.youtube.error, s.instagram.error].filter(Boolean)
      toast(
        t('admin.feeds.synced', { videos: s.youtube.videos, posts: s.instagram.posts }),
        errors.length ? 'error' : 'ok',
      )
    } catch (err) {
      console.error(err)
      toast(t('admin.common.error'), 'error')
    } finally {
      setBusy(false)
    }
  }

  const saveToken = async () => {
    if (token.trim().length < 20) return toast(t('admin.feeds.tokenInvalid'), 'error')
    // Long-lived tokens are valid for 60 days; the sync refreshes them 10 days before expiry.
    await setDoc(doc(adminDb, 'secrets/instagram'), {
      accessToken: token.trim(),
      expiresAt: Timestamp.fromMillis(Date.now() + 55 * 86_400_000),
    })
    setToken('')
    toast(t('admin.feeds.tokenSaved'))
    await sync()
  }

  return (
    <Card
      title={t('admin.feeds.title')}
      className="mb-6"
      actions={
        <button
          type="button"
          onClick={sync}
          disabled={busy}
          className={buttonClass('glass', '', 'sm')}
        >
          <RefreshCw className={`size-4 ${busy ? 'animate-spin' : ''}`} aria-hidden="true" />{' '}
          {t('admin.feeds.syncNow')}
        </button>
      }
    >
      <p className="mb-4 text-sm text-muted">{t('admin.feeds.intro')}</p>
      <div className="space-y-5">
        <div className="flex gap-3">
          <SocialIcon icon="youtube" className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">YouTube</p>
            <p className="mb-1 text-xs text-white/70">{t('admin.feeds.youtubeHint')}</p>
            <Status
              updatedAt={yt?.updatedAt}
              error={yt?.error}
              count={yt?.items?.length ?? 0}
              label={t('admin.feeds.videos')}
            />
          </div>
        </div>
        <div className="flex gap-3">
          <SocialIcon icon="instagram" className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Instagram{' '}
              <span
                className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${connected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-white/10 text-white/60'}`}
              >
                {connected ? t('admin.feeds.connected') : t('admin.feeds.notConnected')}
              </span>
            </p>
            <p className="mb-2 text-xs text-white/70">{t('admin.feeds.instagramHint')}</p>
            {connected && (
              <Status
                updatedAt={ig?.updatedAt}
                error={ig?.error}
                count={ig?.items?.length ?? 0}
                label={t('admin.feeds.posts')}
              />
            )}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <TextField
                className="flex-1"
                label={connected ? t('admin.feeds.replaceToken') : t('admin.feeds.token')}
                type="password"
                value={token}
                onChange={setToken}
                placeholder="IGAA…"
              />
              <button
                type="button"
                onClick={saveToken}
                disabled={!token || busy}
                className={buttonClass('primary', '', 'md')}
              >
                {t('admin.feeds.connect')}
              </button>
            </div>
            {connected && (
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm(t('admin.feeds.confirmDisconnect'))) return
                  await deleteDoc(doc(adminDb, 'secrets/instagram'))
                  toast(t('admin.feeds.disconnected'))
                }}
                className="mt-2 text-xs text-white/50 underline-offset-2 hover:text-accent hover:underline"
              >
                {t('admin.feeds.disconnect')}
              </button>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
