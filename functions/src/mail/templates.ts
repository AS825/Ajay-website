import {
  EVENT_TIME_ZONE,
  type Booking,
  type EventDoc,
  type GuestlistStatus,
  type Lang,
} from '@ajay/shared'

/** Document shape for the "Trigger Email from Firestore" extension (SPEC §2). */
export interface MailAttachment {
  filename: string
  /** base64 */
  content: string
  encoding: 'base64'
  contentType: string
  /** Referenced in the HTML as <img src="cid:..."> (inline image). */
  cid?: string
}

export interface MailDoc {
  to: string | string[]
  replyTo?: string
  message: { subject: string; html: string; text: string; attachments?: MailAttachment[] }
}

export const QR_CID = 'guest-pass-qr'

/** Stored booking fields (form data without consent checkbox and honeypot). */
export type BookingData = Omit<Booking, 'privacyAccepted' | 'website'>

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const ACCENT = '#FF2D2D'

/**
 * Minimal, dark, table-based layout that renders in Gmail, Apple Mail and
 * Outlook. All dynamic values must be escaped by the caller (use `esc`).
 */
function layout(opts: {
  preheader: string
  heading: string
  body: string
  cta?: { href: string; label: string }
}) {
  const cta = opts.cta
    ? `<tr><td style="padding:8px 0 24px"><a href="${esc(opts.cta.href)}" style="display:inline-block;background:${ACCENT};color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:999px">${esc(opts.cta.label)}</a></td></tr>`
    : ''
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="dark light"></head>
<body style="margin:0;background:#000;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden">${esc(opts.preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding-bottom:32px;font-size:20px;font-weight:800;letter-spacing:-0.04em">AJAY<span style="color:${ACCENT}">.</span></td></tr>
<tr><td style="padding-bottom:16px;font-size:30px;line-height:1.1;font-weight:800;letter-spacing:-0.03em">${opts.heading}</td></tr>
<tr><td style="padding-bottom:24px;font-size:16px;line-height:1.6;color:#d4d4d8">${opts.body}</td></tr>
${cta}
<tr><td style="border-top:1px solid #27272a;padding-top:20px;font-size:12px;color:#71717a">AJAY ADAM · DJ &amp; Producer · Vienna<br>NO GENRE, JUST VIBES</td></tr>
</table></td></tr></table></body></html>`
}

function rows(items: [string, string][]): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px">${items
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px 8px 0;color:#a1a1aa;font-size:13px;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:8px 0;color:#fff;font-size:15px">${esc(v).replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('')}</table>`
}

const textRows = (items: [string, string][]) => items.map(([k, v]) => `${k}: ${v}`).join('\n')

function eventDateTime(e: EventDoc<Date>, lang: Lang) {
  const loc = lang === 'de' ? 'de-AT' : 'en-GB'
  const date = new Intl.DateTimeFormat(loc, {
    timeZone: EVENT_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(e.startsAt)
  const time = new Intl.DateTimeFormat(loc, {
    timeZone: EVENT_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(e.startsAt)
  return { date, time }
}

// ---------------------------------------------------------------------------

export function guestlistMail(p: {
  lang: Lang
  status: GuestlistStatus
  firstName: string
  plusOnes: number
  event: EventDoc<Date>
  eventUrl: string
  /** Guest pass link; with `qrPng` the QR code is embedded in the mail (confirmed guests). */
  passUrl?: string
  qrPng?: Buffer
}): MailDoc['message'] {
  const de = p.lang === 'de'
  const { date, time } = eventDateTime(p.event, p.lang)
  const confirmed = p.status === 'confirmed'
  const subject = confirmed
    ? de
      ? `Du stehst auf der Gästeliste: ${p.event.title}`
      : `You're on the guestlist: ${p.event.title}`
    : de
      ? `Warteliste: ${p.event.title}`
      : `Waitlist: ${p.event.title}`
  const intro = confirmed
    ? de
      ? `Hey ${p.firstName}, du stehst auf der Gästeliste. Wir sehen uns!`
      : `Hey ${p.firstName}, you're on the guestlist. See you there!`
    : de
      ? `Hey ${p.firstName}, die Gästeliste ist gerade voll – du stehst auf der Warteliste. Wir melden uns, falls ein Platz frei wird.`
      : `Hey ${p.firstName}, the guestlist is currently full – you're on the waitlist. We'll let you know if a spot opens up.`
  const details: [string, string][] = [
    ['Event', p.event.title],
    [de ? 'Datum' : 'Date', date],
    [de ? 'Uhrzeit' : 'Time', time],
    ['Location', [p.event.venue.name, p.event.venue.address].filter(Boolean).join(', ')],
    [de ? 'Personen' : 'Guests', `1${p.plusOnes ? ` + ${p.plusOnes}` : ''}`],
  ]
  const outro = de
    ? 'Bitte bring einen Ausweis mit. Der Name auf der Liste muss mit dem Ausweis übereinstimmen.'
    : 'Please bring a photo ID. The name on the list must match your ID.'
  const withPass = confirmed && p.passUrl && p.qrPng
  const qrText = de
    ? 'Zeig diesen QR-Code am Einlass – er gilt für dich und deine Begleitung.'
    : 'Show this QR code at the door – it covers you and your plus-ones.'
  const qrBlock = withPass
    ? `<div style="margin:24px 0 8px;text-align:center"><div style="display:inline-block;background:#fff;padding:14px;border-radius:18px"><img src="cid:${QR_CID}" width="220" height="220" alt="QR" style="display:block"></div><p style="margin:12px 0 0;color:#d4d4d8;font-size:14px">${esc(qrText)}</p></div>`
    : ''
  return {
    subject,
    html: layout({
      preheader: intro,
      heading: esc(
        confirmed ? (de ? 'Du bist drauf.' : "You're in.") : de ? 'Warteliste.' : 'Waitlist.',
      ),
      body: `${esc(intro)}${qrBlock}${rows(details)}<p style="margin:20px 0 0;color:#a1a1aa;font-size:14px">${esc(outro)}</p>`,
      cta: withPass
        ? { href: p.passUrl!, label: de ? 'Gästepass öffnen' : 'Open guest pass' }
        : { href: p.eventUrl, label: de ? 'Event ansehen' : 'View event' },
    }),
    text: `${intro}\n\n${withPass ? `${qrText}\n${p.passUrl}\n\n` : ''}${textRows(details)}\n\n${outro}\n\n${p.eventUrl}`,
    ...(withPass
      ? {
          attachments: [
            {
              filename: 'guest-pass.png',
              content: p.qrPng!.toString('base64'),
              encoding: 'base64' as const,
              contentType: 'image/png',
              cid: QR_CID,
            },
          ],
        }
      : {}),
  }
}

export interface DigestGuest {
  firstName: string
  lastName: string
  email: string
  phone: string
  plusOnes: number
  status: GuestlistStatus
  checkedIn: boolean
}

/**
 * Guest list before an event, for Ajay / the door: sorted by last name, with
 * totals, plus a CSV attachment (Excel-friendly).
 */
export function guestlistDigestMail(p: {
  event: EventDoc<Date>
  guests: DigestGuest[]
  csv: string
  adminUrl: string
}): MailDoc['message'] {
  const { date, time } = eventDateTime(p.event, 'de')
  const confirmed = p.guests.filter((g) => g.status === 'confirmed')
  const waitlist = p.guests.filter((g) => g.status === 'waitlist')
  const people = (list: DigestGuest[]) => list.reduce((n, g) => n + 1 + g.plusOnes, 0)
  const byName = (a: DigestGuest, b: DigestGuest) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, 'de')
  const table = (list: DigestGuest[]) =>
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:8px;border-collapse:collapse">${list
      .slice()
      .sort(byName)
      .map(
        (g, i) =>
          `<tr style="border-top:1px solid #27272a"><td style="padding:8px 8px 8px 0;color:#71717a;font-size:12px;width:24px">${i + 1}</td><td style="padding:8px 0;color:#fff;font-size:15px"><b>${esc(g.lastName)}</b>, ${esc(g.firstName)}${g.plusOnes ? ` <span style="color:#a1a1aa">+${g.plusOnes}</span>` : ''}</td><td style="padding:8px 0;color:#a1a1aa;font-size:12px;text-align:right">${esc(g.phone)}</td></tr>`,
      )
      .join('')}</table>`
  const summary = `${confirmed.length} Einträge · ${people(confirmed)} Personen bestätigt${waitlist.length ? ` · ${people(waitlist)} auf der Warteliste` : ''}`
  return {
    subject: `Gästeliste: ${p.event.title} – ${date}`,
    html: layout({
      preheader: summary,
      heading: esc(`Gästeliste ${p.event.title}`),
      body: `${esc(`${date}, ${time} · ${p.event.venue.name}`)}<p style="margin:12px 0 0;color:#fff;font-weight:700">${esc(summary)}</p>${confirmed.length ? table(confirmed) : '<p style="color:#a1a1aa">Noch keine bestätigten Gäste.</p>'}${waitlist.length ? `<p style="margin:24px 0 0;color:#fbbf24;font-weight:700">Warteliste</p>${table(waitlist)}` : ''}<p style="margin:20px 0 0;color:#a1a1aa;font-size:13px">Die komplette Liste (mit E-Mails) hängt als CSV an. Einchecken am Einlass: Admin → Events → Scanner.</p>`,
      cta: { href: p.adminUrl, label: 'Scanner öffnen' },
    }),
    text: `Gästeliste ${p.event.title} – ${date}, ${time}\n${summary}\n\n${confirmed
      .slice()
      .sort(byName)
      .map(
        (g, i) => `${i + 1}. ${g.lastName}, ${g.firstName}${g.plusOnes ? ` +${g.plusOnes}` : ''}`,
      )
      .join('\n')}\n\n${p.adminUrl}`,
    attachments: [
      {
        filename: `gaesteliste-${p.event.slug}.csv`,
        content: Buffer.from(p.csv, 'utf8').toString('base64'),
        encoding: 'base64',
        contentType: 'text/csv',
      },
    ],
  }
}

const BOOKING_LABELS = {
  en: {
    name: 'Name',
    company: 'Company / promoter',
    email: 'Email',
    phone: 'Phone',
    eventType: 'Type of event',
    date: 'Date',
    location: 'City / venue',
    setLength: 'Set length',
    expectedGuests: 'Expected guests',
    budget: 'Budget',
    message: 'Message',
  },
  de: {
    name: 'Name',
    company: 'Firma / Veranstalter',
    email: 'E-Mail',
    phone: 'Telefon',
    eventType: 'Art des Events',
    date: 'Datum',
    location: 'Stadt / Location',
    setLength: 'Set-Länge',
    expectedGuests: 'Erwartete Gäste',
    budget: 'Budget',
    message: 'Nachricht',
  },
} as const

const EVENT_TYPE_LABELS = {
  en: {
    club: 'Club',
    festival: 'Festival',
    private: 'Private',
    corporate: 'Corporate',
    wedding: 'Wedding',
    other: 'Other',
  },
  de: {
    club: 'Club',
    festival: 'Festival',
    private: 'Privat',
    corporate: 'Firmenevent',
    wedding: 'Hochzeit',
    other: 'Sonstiges',
  },
} as const

const BUDGET_LABELS = {
  en: {
    lt500: 'Under €500',
    '500to1000': '€500 – €1,000',
    '1000to2000': '€1,000 – €2,000',
    gt2000: 'Over €2,000',
    tbd: 'To be discussed',
  },
  de: {
    lt500: 'Unter 500 €',
    '500to1000': '500 – 1.000 €',
    '1000to2000': '1.000 – 2.000 €',
    gt2000: 'Über 2.000 €',
    tbd: 'Nach Absprache',
  },
} as const

function bookingRows(b: BookingData, lang: Lang): [string, string][] {
  const l = BOOKING_LABELS[lang]
  const all: [string, string | undefined][] = [
    [l.name, b.name],
    [l.company, b.company],
    [l.email, b.email],
    [l.phone, b.phone],
    [l.eventType, EVENT_TYPE_LABELS[lang][b.eventType]],
    [l.date, b.date],
    [l.location, b.location],
    [l.setLength, b.setLength],
    [l.expectedGuests, String(b.expectedGuests)],
    [l.budget, BUDGET_LABELS[lang][b.budget]],
    [l.message, b.message],
  ]
  return all.filter((r): r is [string, string] => !!r[1])
}

/** Notification to the booking inbox (English labels). Reply-To is the requester, so "Reply" answers them. */
export function bookingNotificationMail(b: BookingData): MailDoc['message'] {
  const r = bookingRows(b, 'en')
  const subject = `Booking request: ${EVENT_TYPE_LABELS.en[b.eventType]} · ${b.date} · ${b.location}`
  return {
    subject,
    html: layout({
      preheader: `${b.name} – ${b.location}, ${b.date}`,
      heading: esc('New booking request'),
      body: `Reply to this email to answer ${esc(b.name)} directly.${rows(r)}`,
    }),
    text: `New booking request\n\n${textRows(r)}`,
  }
}

/** Receipt for the requester (SPEC §9 "Eingangsbestätigung"). */
export function bookingReceiptMail(b: BookingData, lang: Lang): MailDoc['message'] {
  const de = lang === 'de'
  const r = bookingRows(b, lang)
  const intro = de
    ? `Hey ${b.name}, danke für deine Anfrage! Ich melde mich so schnell wie möglich bei dir.`
    : `Hey ${b.name}, thanks for your request! I'll get back to you as soon as possible.`
  return {
    subject: de ? 'Deine Booking-Anfrage bei AJAY ADAM' : 'Your booking request for AJAY ADAM',
    html: layout({
      preheader: intro,
      heading: esc(de ? 'Anfrage erhalten.' : 'Request received.'),
      body: `${esc(intro)}<p style="margin:20px 0 4px;color:#a1a1aa;font-size:13px">${esc(de ? 'Deine Angaben' : 'Your details')}</p>${rows(r)}`,
    }),
    text: `${intro}\n\n${textRows(r)}`,
  }
}
