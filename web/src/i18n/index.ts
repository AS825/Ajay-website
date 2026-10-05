import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import type { Lang } from '@ajay/shared'
import en from './en.json'
import de from './de.json'

const STORAGE_KEY = 'lang'

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'de') return stored
  } catch {
    /* storage unavailable */
  }
  return 'en' // English is the default (SPEC §17)
}

void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, de: { translation: de } },
  lng: initialLang(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    /* storage unavailable */
  }
})
document.documentElement.lang = i18n.language

export function useLang() {
  const { i18n: inst } = useTranslation()
  const lang: Lang = inst.language === 'de' ? 'de' : 'en'
  return { lang, setLang: (l: Lang) => void inst.changeLanguage(l) }
}

export default i18n
