import type { ReactNode } from 'react'

export function Section({
  id,
  eyebrow,
  title,
  action,
  children,
  className = '',
}: {
  id?: string
  eyebrow?: string
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  const headingId = id ? `${id}-title` : undefined
  return (
    <section
      id={id}
      aria-labelledby={title ? headingId : undefined}
      className={`py-16 md:py-28 ${className}`}
    >
      {title && (
        <header className="px-safe mx-auto mb-8 flex max-w-6xl items-end justify-between gap-4 md:mb-12">
          <div>
            {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
            <h2 id={headingId} className="display-lg">
              {title}
            </h2>
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  )
}

export function Container({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`px-safe mx-auto max-w-6xl ${className}`}>{children}</div>
}
