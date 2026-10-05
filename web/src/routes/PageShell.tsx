import type { ReactNode } from 'react'

/** Top spacing for sub-pages below the fixed header. */
export function PageShell({ children }: { children: ReactNode }) {
  return <div style={{ paddingTop: 'calc(var(--header-h) + var(--safe-top))' }}>{children}</div>
}
