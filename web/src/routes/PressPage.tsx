import { useTranslation } from 'react-i18next'
import { Download } from 'lucide-react'
import { localize } from '@ajay/shared'
import { useSiteData } from '../lib/data'
import { useLang } from '../i18n'
import { Container, Section } from '../components/ui/Section'
import { MediaPlaceholder } from '../components/ui/MediaPlaceholder'
import { buttonClass } from '../components/ui/Button'
import { PageShell } from './PageShell'

/** Press kit (SPEC §4 /press). Content and PDF are managed in the admin. */
export function PressPage() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  return (
    <PageShell>
      <Section headingLevel="h1" eyebrow={t('press.eyebrow')} title={t('press.title')}>
        <Container className="grid gap-12 md:grid-cols-2">
          <div className="space-y-10">
            <div>
              <h2 className="eyebrow mb-3">{t('press.short')}</h2>
              <p className="text-lg text-white/85">{localize(site.bioShort, lang)}</p>
            </div>
            <div>
              <h2 className="eyebrow mb-3">{t('press.long')}</h2>
              <p className="leading-relaxed whitespace-pre-line text-white/80">
                {localize(site.bioLong, lang)}
              </p>
            </div>
            {site.pressKitPdfUrl ? (
              <a href={site.pressKitPdfUrl} download className={buttonClass('primary')}>
                <Download className="size-4" aria-hidden="true" /> {t('press.download')}
              </a>
            ) : (
              <p className="text-sm text-muted">{t('press.pdfTodo')}</p>
            )}
            <p className="text-sm text-muted">
              {t('press.onRequest')}{' '}
              <a
                href={`mailto:${site.bookingEmail}`}
                className="text-white underline underline-offset-2"
              >
                {site.bookingEmail}
              </a>
            </p>
          </div>
          <div>
            <h2 className="eyebrow mb-3">{t('press.photos')}</h2>
            <div className="grid grid-cols-2 gap-3">
              {site.pressPhotos.length > 0
                ? site.pressPhotos.map((src, i) => (
                    <a key={src} href={src} target="_blank" rel="noopener noreferrer">
                      <img
                        src={src}
                        alt={`${site.artistName} press photo ${i + 1}`}
                        loading="lazy"
                        className="aspect-square w-full rounded-[var(--radius-card)] object-cover"
                      />
                    </a>
                  ))
                : [0, 1, 2, 3].map((i) => (
                    <MediaPlaceholder
                      key={i}
                      label={i === 0 ? 'TODO' : undefined}
                      className="aspect-square rounded-[var(--radius-card)]"
                    />
                  ))}
            </div>
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}
