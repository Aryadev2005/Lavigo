import type { Metadata } from 'next'
import Link from 'next/link'
import { ItineraryDoc } from '@/components/Itinerary'
import { ADVANCE } from '@/lib/config'
import { getDestinations } from '@/lib/data'
import { addDays, fmtDate, inr } from '@/lib/format'
import { GROUND, TIERS, TRAVEL, decodePlan, quote } from '@/lib/pricing'

export const metadata: Metadata = { title: 'Your trip itinerary', robots: { index: false, follow: false } }

export default async function PlanItinerary({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  const [sp, dests] = await Promise.all([searchParams, getDestinations()])
  const b = decodePlan(sp.p ?? '')
  const q = b ? quote(b, dests) : null
  if (!b || !q || !q.ok)
    return (
      <div className="m-page"><div className="m-wrap" style={{ padding: '60px 24px' }}>
        <h1 className="m-h3">This itinerary link is not complete</h1>
        <p className="m-muted" style={{ margin: '8px 0 16px' }}>Open the trip planner, choose your places and press Download itinerary again.</p>
        <Link href="/plan" className="m-btn-sun">Open the trip planner</Link>
      </div></div>
    )

  const names = q.stops
  const from = b.from.trim()
  const facts: [string, string][] = [
    ['Dates', `${fmtDate(b.start, { day: 'numeric', month: 'short', year: 'numeric' })} to ${fmtDate(addDays(b.start, q.nights), { day: 'numeric', month: 'short', year: 'numeric' })}`],
    ['Starts from', from || 'Your city'],
    ['Travellers', `${b.adults} adult${b.adults > 1 ? 's' : ''}${b.kids ? `, ${b.kids} child${b.kids > 1 ? 'ren' : ''}` : ''}`],
    ['Estimate', q.priced ? `${inr(q.total)} (about ${inr(q.perPerson)} per person)${q.others.length ? `, plus ${q.others.map((o) => o.name).join(', ')}` : ''}` : 'Priced by Lavigo on WhatsApp'],
    ['Stay', TIERS[b.tier].name],
    ['Travel', b.tickets === 'agency' ? `${TRAVEL[b.travel].name} tickets booked by Lavigo · ${GROUND[b.ground].name}` : `Own tickets · ${GROUND[b.ground].name}`],
  ]
  return (
    <ItineraryDoc
      kind="Custom trip plan"
      title={`${names.join(' + ')}, ${q.nights} nights`}
      route={[from || 'Your city', ...names, from || 'Your city'].join(' → ')}
      facts={facts}
      days={q.days.map((d) => ({ n: d.n, date: fmtDate(d.date, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), title: d.title, text: d.text }))}
      included={q.included}
      excluded={q.excluded}
      hotels={q.hotels}
      cars={b.ground === 'private' ? q.cars : []}
      hotelNote={`${TIERS[b.tier].name} hotels we book at your destinations, subject to availability. We confirm the exact hotels with your quote.`}
      notes={[
        'This plan is an estimate. Lavigo confirms the final price, hotels and tickets on WhatsApp.',
        `A ${ADVANCE * 100}% advance${q.priced ? ` (${inr(q.advance)})` : ''} confirms a custom trip. The balance is due before you travel.`,
        'Carry a government photo ID for every traveller (passport or voter ID for Nepal).',
      ]}
      backHref={`/plan?${q.order[0] ? `dest=${q.order[0]}&` : ''}date=${b.start}&pax=${b.adults}${from ? `&from=${encodeURIComponent(from)}` : ''}`}
      fileName={`Lavigo itinerary - ${names.join(' + ')} - ${b.start}`}
    />
  )
}
