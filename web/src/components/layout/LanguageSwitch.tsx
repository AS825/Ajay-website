import { useTranslation } from 'react-i18next'
import { useLang } from '../../i18n'
import { SegmentedControl } from '../ui/SegmentedControl'

/** EN/DE segmented control. */
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { t } = useTranslation()
  const { lang, setLang } = useLang()
  return (
    <SegmentedControl
      label={t('lang.label')}
      value={lang}
      onChange={setLang}
      className={className}
      options={[
        { value: 'en', label: t('lang.en') },
        { value: 'de', label: t('lang.de') },
      ]}
    />
  )
}
