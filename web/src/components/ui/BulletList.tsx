import { Reveal } from '../motion/Reveal'

/** Press-kit style list: uppercase lines with round bullets, optional small heading. */
export function BulletList({
  items,
  title,
  className = 'text-lg md:text-xl',
}: {
  items: string[]
  title?: string
  className?: string
}) {
  return (
    <div>
      {title && <h3 className="mb-3 text-sm font-bold tracking-[0.12em] uppercase">{title}:</h3>}
      <ul className={`space-y-0.5 uppercase ${className}`}>
        {items.map((v, i) => (
          <li key={`${v}-${i}`}>
            <Reveal delay={Math.min(i, 12) * 0.03} className="flex items-baseline gap-3">
              <span
                className="size-1.5 shrink-0 -translate-y-[0.2em] rounded-full bg-current"
                aria-hidden="true"
              />
              <span>{v}</span>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  )
}
