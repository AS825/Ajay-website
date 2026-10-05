import type { ReactNode } from 'react'
import { Reveal, RevealText } from '../motion/Reveal'

export function Section({
  id,
  eyebrow,
  title,
  action,
  children,
  className = '',
  headingLevel = 'h2',
}: {
  id?: string
  eyebrow?: string
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Sub-pages use their section title as the page's h1. */
  headingLevel?: 'h1' | 'h2'
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
            {eyebrow && (
              <Reveal>
                <p className="eyebrow mb-3">{eyebrow}</p>
              </Reveal>
            )}
            <RevealText
              as={headingLevel}
              id={headingId}
              text={title}
              className="display-lg block"
            />
          </div>
          {action && <Reveal delay={0.2}>{action}</Reveal>}
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
