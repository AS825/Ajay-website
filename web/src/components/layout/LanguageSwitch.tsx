import { useTranslation } from 'react-i18next'
import { useLang } from '../../i18n'

/** EN/DE segmented control. */
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const { lang, setLang } = useLang()
  return (
    <div
      role="group"
      aria-label={t('lang.label')}
      className={`glass inline-flex rounded-full p-1 ${className}`}
    >
      {(['en', 'de'] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`pressable min-h-10 min-w-12 rounded-full px-3 text-xs font-bold tracking-widest transition-colors ${
            lang === l ? 'bg-white text-black' : 'text-white/70'
          }`}
        >
          {t(`lang.${l}`)}
        </button>
      ))}
    </div>
  )
}
