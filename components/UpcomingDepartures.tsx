'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Art } from './Art'
import { Icon } from './Icons'
import { MonthChips } from './MonthChips'
import SpotlightCard from './SpotlightCard'
import { dateRangeLabel, daysTo, fmtDate, inr } from '@/lib/format'
import { monthsFromDates } from '@/lib/months'
import { useMonthFilter } from '@/lib/useMonthFilter'
import './UpcomingDepartures.css'

export type DepartureCardData = {
  key: string
  slug: string
  title: string
  image: string | null
  theme: [string, string, string]
  nights: number
  date: string
  startCity: string
  seatsLeft: number
  seatsTotal: number
  price: number
}

const ROWS = 4

function seatsNote(left: number, total: number) {
  if (left === 0) return { text: 'Sold out', tone: 'sold' }
  if (left < 5) return { text: `Only ${left} left`, tone: 'low' }
  if (left < total) return { text: `${left} seats left`, tone: '' }
  return { text: `${total}-seat group`, tone: '' }
}

/** Booked share of the group, as a thin meter. */
function Seats({ d }: { d: DepartureCardData }) {
  const s = seatsNote(d.seatsLeft, d.seatsTotal)
  const booked = d.seatsTotal ? Math.round(((d.seatsTotal - d.seatsLeft) / d.seatsTotal) * 100) : 0
  return (
    <span className={'ud-seats ' + s.tone}>
      <span className="ud-meter" aria-hidden="true"><span style={{ width: `${Math.max(booked, 4)}%` }} /></span>
      {s.text}
    </span>
  )
}

function Pic({ d, sizes }: { d: DepartureCardData; sizes: string }) {
  return d.image
    ? <Image src={d.image} alt="" fill sizes={sizes} style={{ objectFit: 'cover' }} />
    : <Art theme={d.theme} id={'ud' + d.key} h={240} />
}

/** Home page "Upcoming group departures": the next trip as a feature card, the following ones as a compact list. */
export function UpcomingDepartures({ departures }: { departures: DepartureCardData[] }) {
  const months = monthsFromDates(departures.map((d) => d.date))
  const [month, setMonth] = useMonthFilter()
  const list = month ? departures.filter((d) => d.date.slice(0, 7) === month) : departures
  const [lead, ...rest] = list
  const rows = rest.slice(0, ROWS)
  const more = list.length - 1 - rows.length
  if (!lead) return null
  const days = daysTo(lead.date)

  return (
    <div className="ud">
      <MonthChips months={months} selected={month} onSelect={setMonth} />
      <div className="ud-grid">
        <SpotlightCard theme="dark" spotlightColor="#C9B5F4" intensity={0.22} spotlightSize={320} softness={0.7} borderGlow={0.8} proximity={80} smoothing={0.3} flare className="ud-lead"
          style={{ ['--spotlight-card-border' as string]: 'rgba(201,181,244,.2)' }}>
          <Link href={`/trips/${lead.slug}`} className="ud-lead-in" key={lead.key}>
            <span className="ud-lead-pic">
              <Pic d={lead} sizes="(max-width:900px) 100vw, 480px" />
              <span className="ud-badge"><i aria-hidden="true" />Next departure</span>
              <span className="ud-count" suppressHydrationWarning>{days <= 0 ? 'Leaves today' : days === 1 ? 'Leaves tomorrow' : <><b>{days}</b> days to go</>}</span>
            </span>
            <span className="ud-lead-body">
              <span className="ud-when">{dateRangeLabel(lead.date, lead.nights)} · {lead.nights}N / {lead.nights + 1}D</span>
              <b className="ud-lead-t">{lead.title}</b>
              <span className="ud-from"><Icon name="pin" size={14} /> Starts from {lead.startCity}</span>
              <Seats d={lead} />
              <span className="ud-lead-foot">
                <span><span className="ud-price">{inr(lead.price)}</span><small>per person · incl. GST</small></span>
                <span className="ud-btn">{lead.seatsLeft ? 'Book now' : 'See dates'} <Icon name="arrow" size={16} /></span>
              </span>
            </span>
          </Link>
        </SpotlightCard>

        <div className="ud-list">
          {rows.map((d, i) => (
            <SpotlightCard key={d.key} theme="light" spotlightColor="#6042AE" intensity={0.5} spotlightSize={220} softness={0.8} borderGlow={0.9} proximity={60} smoothing={0.3} flare
              className="ud-row" style={{ ['--spotlight-card-surface' as string]: 'rgba(255,255,255,.86)', ['--spotlight-card-border' as string]: 'rgba(96,66,174,.14)', animationDelay: `${i * 60}ms` }}>
              <Link href={`/trips/${d.slug}`} className="ud-row-in">
                <span className="ud-date" aria-hidden="true">
                  <small>{fmtDate(d.date, { month: 'short' })}</small>
                  <b>{fmtDate(d.date, { day: 'numeric' })}</b>
                  <small>{fmtDate(d.date, { weekday: 'short' })}</small>
                </span>
                <span className="ud-thumb"><Pic d={d} sizes="64px" /></span>
                <span className="ud-row-main">
                  <b className="ud-row-t">{d.title}</b>
                  <span className="ud-row-meta">{dateRangeLabel(d.date, d.nights)} · {d.nights}N/{d.nights + 1}D · from {d.startCity}</span>
                  <Seats d={d} />
                </span>
                <span className="ud-row-end">
                  <span className="ud-price sm">{inr(d.price)}</span>
                  <span className="ud-go" aria-hidden="true"><Icon name="arrow" size={16} /></span>
                </span>
              </Link>
            </SpotlightCard>
          ))}
          <SpotlightCard theme="light" spotlightColor="#6042AE" intensity={0.45} spotlightSize={260} softness={0.8} borderGlow={0.9} proximity={60} smoothing={0.3} flare className="ud-promo"
            style={{ ['--spotlight-card-surface' as string]: 'transparent', ['--spotlight-card-border' as string]: 'rgba(96,66,174,.18)' }}>
            <Link href="/plan" className="ud-promo-in">
              <span className="ud-promo-ic" aria-hidden="true"><Icon name="route" size={22} /></span>
              <span className="ud-promo-t"><b>{rows.length ? 'None of these dates work?' : 'That’s the only departure this month.'}</b><small>Plan a private trip from your own city, on your dates, at your pace.</small></span>
              <span className="ud-btn ud-btn-v">Plan my trip <Icon name="arrow" size={16} /></span>
            </Link>
          </SpotlightCard>
          <Link href={'/trips' + (month ? `?month=${month}` : '')} className="ud-all">
            {more > 0 ? `+${more} more departure${more > 1 ? 's' : ''}` : 'See every departure'}
            <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </div>
  )
}
