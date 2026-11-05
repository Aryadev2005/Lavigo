import Image from 'next/image'
import Link from 'next/link'
import { Art } from './Art'
import { daysTo, fmtDate, inr } from '@/lib/format'
import type { TripWithDepartures } from '@/lib/types'

const FALLBACK: [string, string, string] = ['#3A0CA3', '#4CC9F0', '#F1FAEE']

export function TripCard({ trip }: { trip: TripWithDepartures }) {
  const dep = trip.departures[0]
  const name = trip.destination?.name ?? trip.title
  const soldOut = dep && dep.seats_left === 0
  const pct = dep && dep.seats_total ? Math.round((1 - dep.seats_left / dep.seats_total) * 100) : 0
  return (
    <Link className="card trip" href={`/trips/${trip.slug}`}>
      <div className="pic">
        {trip.image
          ? <><Image src={trip.image} alt={`${trip.title}`} fill sizes="(max-width:580px) 100vw, (max-width:900px) 50vw, 360px" style={{ objectFit: 'cover' }} /><span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(20,14,45,.55))' }} /></>
          : <Art theme={trip.destination?.theme ?? FALLBACK} id={trip.slug} />}
        {dep && <span className="chip">{fmtDate(dep.depart_date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
        <span className="nm">{name}</span>
      </div>
      <div className="body">
        <b>{trip.title}</b>
        <span className="muted" style={{ fontSize: 13.5 }}>{trip.route}</span>
        {dep ? (
          <>
            <div className="between" style={{ marginTop: 'auto' }}>
              <div className="price">{inr(dep.price)} <small>/ person</small></div>
              <span className={'chip ' + (soldOut ? 'sold' : dep.seats_left < 10 ? 'warn' : 'lav')}>{soldOut ? 'Sold out' : `${dep.seats_left} seats left`}</span>
            </div>
            <div className="seatbar"><i style={{ width: `${pct}%` }} /></div>
            <small className="muted">{trip.nights}N / {trip.nights + 1}D · {daysTo(dep.depart_date)} days to go</small>
          </>
        ) : (
          <div className="between" style={{ marginTop: 'auto' }}><small className="muted">{trip.nights}N / {trip.nights + 1}D</small><span className="chip lav">Next dates soon</span></div>
        )}
      </div>
    </Link>
  )
}
