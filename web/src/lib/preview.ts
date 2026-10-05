import type { SectionConfig, ThemeSettings } from '@ajay/shared'

/** Messages between the admin design editor and the site rendered in its preview iframe. */
export const PREVIEW_READY = 'ajay:preview-ready'
export const PREVIEW_STATE = 'ajay:preview-state'

export interface PreviewState {
  type: typeof PREVIEW_STATE
  theme: ThemeSettings
  sections: SectionConfig[]
}

export const isPreview = () =>
  typeof window !== 'undefined' &&
  window.parent !== window &&
  new URLSearchParams(window.location.search).has('preview')
