import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ItineraryDoc } from '@/components/Itinerary'
import { ADVANCE, CHILD_FACTOR, GST, HOLD_HOURS } from '@/lib/config'
import { getDestinations, getTripBySlug } from '@/lib/data'
import { addDays, fmtDate, inr } from '@/lib/format'

export const metadata: Metadata = { title: 'Itinerary', robots: { index: false, follow: false } }

export default async function TripItinerary({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ dep?: string }> }) {
  const [{ slug }, sp] = await Promise.all([params, searchParams])
  const [trip, dests] = await Promise.all([getTripBySlug(slug), getDestinations()])
  if (!trip) notFound()
  const dest = dests.find((d) => d.slug === trip.destination?.slug)
  const dep = trip.departures.find((d) => d.id === sp.dep) ?? trip.departures[0]
  const date = (i: number) => (dep ? fmtDate(addDays(dep.depart_date, i), { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : undefined)

  const facts: [string, string][] = [
    ['Duration', `${trip.nights} nights, ${trip.nights + 1} days`],
    ['Departure', dep ? fmtDate(dep.depart_date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Dates coming soon'],
    ['Starts from', dep?.start_city ?? 'To be announced'],
    ['Price', dep ? `${inr(dep.price)} per person, incl. GST` : 'On request'],
  ]
  return (
    <ItineraryDoc
      kind="Group trip itinerary"
      title={trip.title}
      route={trip.route}
      facts={facts}
      days={trip.itinerary.map((d, i) => ({ n: i + 1, date: date(i), title: d.title, text: d.text }))}
      included={trip.inclusions}
      excluded={trip.exclusions}
      hotels={dest?.hotels ?? []}
      cars={dest?.cars ?? []}
      hotelNote="The group stays in one of these hotels or a similar one. The exact hotel is confirmed before departure."
      notes={[
        `Seats are held for ${HOLD_HOURS} hours after booking online. A ${ADVANCE * 100}% advance on WhatsApp confirms them; the balance is due before you travel.`,
        `Prices include ${GST * 100}% GST. Children aged 5 to 11 pay ${CHILD_FACTOR * 100}% of the adult price.`,
        'Live somewhere else? Lavigo can book your train or flight to the starting city.',
        'Carry a government photo ID for every traveller (passport or voter ID for Nepal).',
      ]}
      backHref={`/trips/${trip.slug}`}
      fileName={`Lavigo itinerary - ${trip.title}${dep ? ' - ' + dep.depart_date : ''}`}
    />
  )
}
