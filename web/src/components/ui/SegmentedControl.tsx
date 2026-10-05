import { useId } from 'react'
import { m } from 'motion/react'
import { spring } from '../../lib/motion'

/** iOS-style segmented control with a sliding pill. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className = '',
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  const pillId = useId()
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`glass inline-flex rounded-full p-1 ${className}`}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`pressable relative min-h-10 min-w-12 rounded-full px-3 text-xs font-bold tracking-widest transition-colors duration-300 ${
              active ? 'text-black' : 'text-white/70'
            }`}
          >
            {active && (
              <m.span
                layoutId={pillId}
                className="absolute inset-0 rounded-full bg-white"
                transition={spring}
                aria-hidden="true"
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        )
      })}
    </div>
  )
}
