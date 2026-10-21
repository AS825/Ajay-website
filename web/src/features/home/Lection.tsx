import { useTranslation } from 'react-i18next'
import { m, useReducedMotion } from 'motion/react'
import { Section } from '../../components/ui/Section'
import { useSiteData } from '../../lib/data'
import { easeOutExpo } from '../../lib/motion'

const WORD = 'LECTION'

/** Ajay's event series (press kit "Events"): a huge LECTION that links to its page. */
export function Lection() {
  const { t } = useTranslation()
  const { site } = useSiteData()
  const reduced = useReducedMotion()
  const url = site.lectionUrl.trim()
  if (!/^https?:\/\//.test(url)) return null

  return (
    <Section id="lection" className="overflow-hidden text-center">
      <p className="mb-2 text-lg uppercase md:text-2xl">{t('lection.more')}</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative inline-block px-4"
        aria-label={`LECTION – ${t('lection.more')}`}
      >
        <span
          className="font-wide flex justify-center text-[15vw] leading-[0.9] tracking-[-0.02em] md:text-[11vw] xl:text-[9.5rem]"
          aria-hidden="true"
        >
          {WORD.split('').map((ch, i) => (
            <m.span
              key={i}
              className="inline-block transition-transform duration-300 group-hover:-translate-y-[0.06em] group-hover:text-accent"
              style={{ transitionDelay: `${i * 35}ms` }}
              initial={reduced ? false : { opacity: 0, y: '0.5em', scaleY: 1.6 }}
              whileInView={{ opacity: 1, y: 0, scaleY: 1 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.9, ease: easeOutExpo, delay: i * 0.05 }}
            >
              {ch}
            </m.span>
          ))}
        </span>
        {/* Beat line under the word */}
        <span
          className="beat-pulse mx-auto mt-3 block h-[3px] w-1/3 origin-center rounded-full bg-accent transition-[width] duration-500 group-hover:w-full"
          aria-hidden="true"
        />
      </a>
      <p className="mt-4 text-sm tracking-[0.2em] uppercase opacity-70">{t('lection.tagline')}</p>
    </Section>
  )
}
