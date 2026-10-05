import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './i18n'
import { App } from './app/App'

/**
 * After a deploy, a tab that still runs the old version may try to load code
 * chunks that no longer exist. Reload once to get the current version instead
 * of breaking (guarded so it can never loop).
 */
window.addEventListener('vite:preloadError', (event) => {
  try {
    const last = Number(sessionStorage.getItem('ajay:chunk-reload') ?? 0)
    if (Date.now() - last < 30_000) return
    sessionStorage.setItem('ajay:chunk-reload', String(Date.now()))
  } catch {
    /* storage blocked – still reload once */
  }
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
