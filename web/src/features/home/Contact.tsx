import { useTranslation } from 'react-i18next'
import { m, useReducedMotion } from 'motion/react'
import { Reveal } from '../../components/motion/Reveal'
import { SmartLink } from '../../components/ui/SmartLink'
import { useSiteData } from '../../lib/data'
import { BRAND } from '../../lib/brand'
import { easeOutExpo } from '../../lib/motion'

/** Closing block (press kit): website and booking mail, portrait, big "click here" to booking. */
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
        <Reveal className="self-start text-center text-xl md:pt-10 md:text-left md:text-2xl">
          <p>www.ajay.at</p>
          <a href={`mailto:${site.bookingEmail}`} className="underline-offset-4 hover:underline">
            {site.bookingEmail}
          </a>
        </Reveal>
        <m.img
          src={site.contactPhoto || BRAND.contact}
          alt={site.artistName}
          loading="lazy"
          className="mx-auto w-[min(86vw,460px)]"
          initial={reduced ? false : { opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 1.2, ease: easeOutExpo }}
        />
        <div className="flex justify-center self-center pb-10 md:justify-start md:pb-0">
          <SmartLink
            href="/booking"
            className="pressable group relative inline-flex items-center rounded-full bg-[#fff] px-8 py-3 text-2xl text-[#141110] uppercase shadow-[0_10px_30px_-12px_rgb(0_0_0/0.5)] md:text-4xl"
          >
            <span
              className="beat-pulse absolute inset-0 -z-10 rounded-full ring-2 ring-accent"
              aria-hidden="true"
            />
            {t('contact.cta')}
          </SmartLink>
        </div>
      </div>
    </section>
  )
}
