import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { Legal } from '@/components/Legal'
import { BUSINESS } from '@/lib/config'
export const metadata: Metadata = pageMeta({ title: 'Cancellation and refund policy', description: 'Cancellation charges and refund timelines for Lavigo Travel Co. group trips and custom holidays.', path: '/refund-policy' })
// NOTE: exact refund slabs must come from the owner. Update this page (and add the slab table) before payments go live.
export default function Refunds() {
  return (
    <Legal title="Cancellation and refund policy" updated="5 November 2026">
      <h2>If you cancel</h2>
      <p>Tell us on WhatsApp ({BUSINESS.phoneDisplay}) as early as you can. How much can be refunded depends on how close to departure you cancel and on costs already committed for your trip, such as hotels, transport and permits. Lavigo will state the exact terms for your trip in writing on WhatsApp before you pay your advance.</p>
      <h2>If Lavigo cancels</h2>
      <p>If we cancel a departure, you can move to another date or receive a full refund of what you paid for that departure.</p>
      <h2>Unpaid holds</h2>
      <p>If you hold seats but do not pay the advance within 24 hours, the hold ends automatically and nothing is charged.</p>
      <h2>How refunds are paid</h2>
      <p>Refunds are made to the original payment method or bank account used, and usually reach you within 7 to 10 working days of approval.</p>
      <h2>Contact</h2>
      <p>For any cancellation or refund question, message us on WhatsApp at {BUSINESS.phoneDisplay}.</p>
    </Legal>
  )
}
