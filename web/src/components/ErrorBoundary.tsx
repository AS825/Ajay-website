import { Component, type ReactNode } from 'react'
import i18n from '../i18n'
import { buttonClass } from './ui/Button'

/**
 * Catches render/lazy-load errors so one broken part never blanks the whole
 * page (React unmounts everything on an uncaught error).
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[app] render error:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div
        className="flex min-h-[60svh] flex-col items-center justify-center gap-4 px-6 text-center"
        role="alert"
      >
        <p className="text-2xl font-bold tracking-tight">{i18n.t('errorBoundary.title')}</p>
        <p className="max-w-sm text-sm text-white/70">{i18n.t('errorBoundary.text')}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className={buttonClass('primary')}
        >
          {i18n.t('errorBoundary.reload')}
        </button>
      </div>
    )
  }
}
