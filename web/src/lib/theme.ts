import type { ThemeSettings } from '@ajay/shared'

const HEX = /^#[0-9a-f]{6}$/i

/** Applies runtime design tokens from settings/theme to :root. */
export function applyTheme(theme: ThemeSettings) {
  const root = document.documentElement
  if (HEX.test(theme.accentColor)) root.style.setProperty('--accent', theme.accentColor)
  if (HEX.test(theme.background.color)) root.style.setProperty('--bg', theme.background.color)
}

export function backgroundCss(bg: ThemeSettings['background']): string {
  if (bg.type === 'gradient' && bg.gradient.colors.length >= 2) {
    return `linear-gradient(${bg.gradient.angle}deg, ${bg.gradient.colors.join(', ')})`
  }
  return bg.color || '#000'
}
