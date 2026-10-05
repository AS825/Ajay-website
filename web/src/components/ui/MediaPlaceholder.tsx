/**
 * Stand-in for missing photos/flyers (TODO until Ajay provides material).
 * Accent gradient + grain so the layout already looks intentional.
 */
export function MediaPlaceholder({
  label,
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={`${/\b(absolute|fixed)\b/.test(className) ? '' : 'relative'} overflow-hidden bg-surface-2 ${className}`}
      style={{
        backgroundImage:
          'radial-gradient(120% 80% at 20% 10%, color-mix(in srgb, var(--accent) 55%, transparent), transparent 60%), radial-gradient(90% 70% at 90% 100%, rgb(255 255 255 / 0.08), transparent 60%)',
      }}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <div className="grain absolute inset-0" aria-hidden="true" />
      {label && (
        <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold tracking-widest text-white/70 uppercase">
          {label}
        </span>
      )}
    </div>
  )
}
