import Image from 'next/image'
import Link from 'next/link'
import { Art } from './Art'
import { fmtDate, inr } from '@/lib/format'
import type { TripWithDepartures } from '@/lib/types'

const FALLBACK: [string, string, string] = ['#3A0CA3', '#4CC9F0', '#F1FAEE']

// Short labels for the chips on trip cards, picked from the trip's inclusions.
export function tripChips(inclusions: string[]) {
  const find = (re: RegExp) => inclusions.find((x) => re.test(x))
  return {
    stay: find(/hotel|stay/i) ? 'Hotel' : null,
    travel: find(/train|cab|travel|bus|flight/i) ?? null,
    meals: find(/meal|breakfast|dinner|lunch/i) ?? null,
  }
}

export function seatLabel(left: number, total: number) {
  if (left === 0) return 'Sold out'
  if (left < total) return `${left} seat${left > 1 ? 's' : ''} left`
  return `${total}-seat group`
}

export function TripCard({ trip }: { trip: TripWithDepartures }) {
  const dep = trip.departures[0]
  const chips = tripChips(trip.inclusions)
  return (
    <Link className="m-card m-trip" href={`/trips/${trip.slug}`}>
      <div className="m-trip-pic">
        {trip.image
          ? <Image src={trip.image} alt={trip.title} fill sizes="(max-width:600px) 100vw, (max-width:980px) 50vw, 290px" style={{ objectFit: 'cover' }} />
          : <Art theme={trip.destination?.theme ?? FALLBACK} id={trip.slug} h={190} />}
        {dep && <span className="m-tag m-tag-w">{fmtDate(dep.depart_date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
        <span className="m-tag m-tag-i">{trip.nights}N / {trip.nights + 1}D</span>
      </div>
      <div className="m-trip-body">
        <b className="m-trip-t">{trip.title}</b>
        <span className="m-muted m-sm">{trip.route}</span>
        <div className="m-chips">
          {chips.stay && <span>{chips.stay}</span>}
          {chips.travel && <span>{chips.travel}</span>}
          {chips.meals && <span>{chips.meals}</span>}
        </div>
        <div className="m-trip-foot">
          {dep ? (
            <>
              <div><div className="m-price">{inr(dep.price)}</div><div className="m-muted m-xs">per person · incl. GST</div></div>
              <span className={'m-seat' + (dep.seats_left === 0 ? ' sold' : '')}>{seatLabel(dep.seats_left, dep.seats_total)}</span>
            </>
          ) : (
            <span className="m-seat">Next dates soon</span>
          )}
        </div>
      </div>
    </Link>
  )
}
