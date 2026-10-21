import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { localize } from '@ajay/shared'
import { Reveal } from '../../components/motion/Reveal'
import { Container, Section } from '../../components/ui/Section'
import { SocialIcon } from '../../components/ui/SocialIcon'
import { useSiteData } from '../../lib/data'
import { useLang } from '../../i18n'

/** "8M+" counts 0 → 8 with the suffix kept; values without a leading number show as typed. */
function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const reduced = useReducedMotion()
  const match = /^(\d+(?:[.,]\d+)?)(.*)$/.exec(value.trim())
  const target = match ? Number(match[1]!.replace(',', '.')) : 0
  const decimals = match?.[1]!.match(/[.,](\d+)/)?.[1]?.length ?? 0
  const [shown, setShown] = useState(reduced || !match ? target : 0)

  useEffect(() => {
    if (!match || reduced || !inView) return
    const controls = animate(0, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: setShown,
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, target, reduced])

  return (
    <span ref={ref} className="tabular-nums">
      {match ? `${shown.toFixed(decimals)}${match[2]}` : value}
    </span>
  )
}

/** "Media statistics" (press kit): platform, label and a big number that counts up. */
export function Stats() {
  const { t } = useTranslation()
  const { lang } = useLang()
  const { site } = useSiteData()
  if (site.stats.length === 0) return null

  return (
    <Section id="stats" title={t('stats.title')}>
      <Container>
        <dl className="max-w-3xl space-y-4 md:space-y-2">
          {site.stats.map((s, i) => (
            <Reveal
              key={`${s.icon}-${i}`}
              delay={i * 0.08}
              className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4 md:grid-cols-[5rem_minmax(0,16rem)_1fr] md:gap-10"
            >
              <SocialIcon icon={s.icon} colored className="size-10 md:size-16" />
              <dt className="text-base leading-tight uppercase md:text-right md:text-2xl">
                {localize(s.label, lang)}
              </dt>
              <dd className="text-4xl font-extrabold tracking-tight md:text-6xl">
                <CountUp value={s.value} />
              </dd>
            </Reveal>
          ))}
        </dl>
      </Container>
    </Section>
  )
}
