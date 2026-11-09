import { BUSINESS, SITE_URL } from '@/lib/config'
import { getDestinations, getTrips } from '@/lib/data'
import { fmtDate, inr } from '@/lib/format'

export const revalidate = 3600

// llms.txt: a plain-text summary for AI assistants and answer engines.
export async function GET() {
  const [trips, dests] = await Promise.all([getTrips(), getDestinations()])
  const lines: string[] = [
    `# ${BUSINESS.name}`,
    '',
    `> Indian travel company (office in Ranchi, Jharkhand) for travellers from anywhere in India. Fixed-date group trips with a trip leader and custom private trips to ${dests.map((d) => d.name).join(', ')}. Custom trips can start from any city; Lavigo can also book the train or flight tickets.`,
    '',
    `Address: ${BUSINESS.address}`,
    `Phone / WhatsApp: ${BUSINESS.phoneDisplay}`,
    `Website: ${SITE_URL}`,
    '',
    '## How booking works',
    '- Group trips: choose a departure on the trip page and hold seats online (held for 24 hours). Pay a 25% advance on WhatsApp to confirm. Balance is due before travel.',
    '- Custom trips: build a plan on the website for a price estimate, then get the final quote on WhatsApp.',
    '- Prices are per person and include 5% GST.',
    '- Each booking records every traveller\'s name and gender, and whether Lavigo or the traveller books the train or flight tickets.',
    '- Trip pages list the hotels and cars used, and every itinerary can be downloaded as a PDF.',
    '',
    '## Group trips',
  ]
  for (const t of trips) {
    const d = t.departures[0]
    lines.push(`- [${t.title}](${SITE_URL}/trips/${t.slug}): ${t.nights}N/${t.nights + 1}D. ${t.route}.` + (d ? ` Next departure ${fmtDate(d.depart_date, { day: 'numeric', month: 'long', year: 'numeric' })} from ${d.start_city}, ${inr(d.price)} per person incl. GST, ${d.seats_left} seats left.` : ' Dates to be announced.'))
  }
  lines.push('', '## Other pages', `- [Plan a custom trip](${SITE_URL}/plan)`, `- [All group trips](${SITE_URL}/trips)`, `- [Cancellation and refund policy](${SITE_URL}/refund-policy)`, `- [Terms of booking](${SITE_URL}/terms)`, '')
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
