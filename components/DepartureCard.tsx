import Image from 'next/image'
import Link from 'next/link'
import { Art } from './Art'
import { Icon } from './Icons'
import { dateRangeLabel, inr } from '@/lib/format'

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

function seatsNote(left: number, total: number) {
  if (left === 0) return { text: 'Sold out', low: false }
  if (left < 5) return { text: 'Few seats left', low: true }
  if (left < total) return { text: `${left} seats left`, low: false }
  return { text: `${total}-seat group`, low: false }
}

/** One departure (date, not just trip): used by the month-filtered "Upcoming departures" grids. */
export function DepartureCard({ d }: { d: DepartureCardData }) {
  const seats = seatsNote(d.seatsLeft, d.seatsTotal)
  return (
    <Link className="m-card m-trip" href={`/trips/${d.slug}`}>
      <div className="m-trip-pic">
        {d.image
          ? <Image src={d.image} alt={d.title} fill sizes="(max-width:600px) 100vw, (max-width:980px) 50vw, 290px" style={{ objectFit: 'cover' }} />
          : <Art theme={d.theme} id={d.key} h={190} />}
        <span className="m-tag m-tag-w">{dateRangeLabel(d.date, d.nights)}</span>
        <span className="m-tag m-tag-i">{d.nights}N / {d.nights + 1}D</span>
      </div>
      <div className="m-trip-body">
        <b className="m-trip-t">{d.title}</b>
        <span className="m-muted m-sm"><Icon name="pin" size={14} /> Starts from {d.startCity}</span>
        <div className="m-trip-foot">
          <div><div className="m-price">{inr(d.price)}</div><div className="m-muted m-xs">per person · incl. GST</div></div>
          <span className={'m-seat' + (d.seatsLeft === 0 ? ' sold' : seats.low ? ' low' : '')}>{seats.text}</span>
        </div>
      </div>
    </Link>
  )
}
