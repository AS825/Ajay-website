import type { Transition } from 'motion/react'

/** Apple-like springs (SPEC §3: spring animations instead of linear transitions). */
export const spring: Transition = { type: 'spring', stiffness: 380, damping: 34, mass: 0.9 }
export const springSoft: Transition = { type: 'spring', stiffness: 170, damping: 26 }
export const springBouncy: Transition = { type: 'spring', stiffness: 420, damping: 18 }
export const easeOutExpo = [0.16, 1, 0.3, 1] as const
