import type { Metadata } from 'next'
import { Legal } from '@/components/Legal'
import { getSite } from '@/lib/site'
import { BUSINESS, HOLD_HOURS } from '@/lib/config'
export const metadata: Metadata = { title: 'Terms of booking', alternates: { canonical: '/terms' } }
export default async function Terms() {
  const { business: biz } = await getSite()
  return (
    <Legal title="Terms of booking" updated="5 November 2026">
      <p>These terms apply to trips booked with {BUSINESS.name}, {biz.address}.</p>
      <h2>Holding seats</h2>
      <p>When you submit the booking form on a group trip, we hold your seats for {HOLD_HOURS} hours. A hold is not a confirmed booking. If the advance is not paid in that time, the seats are released and may be taken by someone else.</p>
      <h2>Confirming a booking</h2>
      <p>Your booking is confirmed when Lavigo confirms it to you after receiving the advance payment (25% of the trip total). The balance is due before you travel; we will tell you the date when we confirm.</p>
      <h2>Prices</h2>
      <p>Group trip prices are per person and include GST. Custom trip prices on this website are estimates; the final price is the quote Lavigo confirms with you in writing on WhatsApp.</p>
      <h2>What is included</h2>
      <p>Each trip page lists what is included and not included. Anything not listed as included is an extra cost.</p>
      <h2>Changes by Lavigo</h2>
      <p>Travel depends on weather, road conditions, permits and local rules. We may adjust an itinerary or, if necessary, reschedule or cancel a departure. If we cancel a departure, you can choose another date or a refund of the amount you paid.</p>
      <h2>Your responsibilities</h2>
      <p>Please carry valid government photo ID for every traveller and follow your trip leader&apos;s instructions. Tell us in advance about any medical needs we should know about.</p>
      <h2>Cancellation by you</h2>
      <p>See our <a href="/refund-policy" style={{ textDecoration: 'underline' }}>cancellation and refund policy</a>.</p>
    </Legal>
  )
}
