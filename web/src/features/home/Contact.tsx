import { useTranslation } from 'react-i18next'
import { m, useReducedMotion } from 'motion/react'
import { Reveal } from '../../components/motion/Reveal'
import { SmartLink } from '../../components/ui/SmartLink'
import { useSiteData } from '../../lib/data'
import { BRAND } from '../../lib/brand'
import { easeOutExpo } from '../../lib/motion'

/** Closing page of the press kit: website and booking mail, portrait, "click here" to booking. */
export function Contact() {
  const { t } = useTranslation()
  const { site } = useSiteData()
  const reduced = useReducedMotion()

  return (
    <section
      id="contact"
      aria-label={t('contact.title')}
      className="relative overflow-hidden pt-16 md:pt-24"
    >
      <div className="px-safe mx-auto grid max-w-6xl items-end gap-8 md:grid-cols-[1fr_auto_1fr]">
        <Reveal className="self-start text-center text-xl md:pt-12 md:text-2xl">
          <p>www.ajay.at</p>
          <a href={`mailto:${site.bookingEmail}`} className="underline-offset-4 hover:underline">
            {site.bookingEmail}
          </a>
        </Reveal>
        <m.img
          src={site.contactPhoto || BRAND.contact}
          alt={site.artistName}
          loading="lazy"
          className="photo-soft mx-auto w-[min(86vw,460px)]"
          initial={reduced ? false : { opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 1.4, ease: easeOutExpo }}
        />
        <Reveal className="flex justify-center self-center pb-12 md:pb-0">
          <SmartLink
            href="/booking"
            className="pressable inline-flex items-center rounded-full bg-[#fff] px-6 py-2 text-2xl text-[#141110] uppercase transition-colors hover:bg-[#141110] hover:text-[#fff] md:text-4xl"
          >
            {t('contact.cta')}
          </SmartLink>
        </Reveal>
      </div>
    </section>
  )
}
