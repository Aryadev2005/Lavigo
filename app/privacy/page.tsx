import type { Metadata } from 'next'
import { pageMeta } from '@/lib/seo'
import { Legal } from '@/components/Legal'
import { getSite } from '@/lib/site'
import { BUSINESS } from '@/lib/config'
export const metadata: Metadata = pageMeta({ title: 'Privacy policy', description: 'How Lavigo Travel Co. collects, uses and protects the details you share when you enquire or book a trip.', path: '/privacy' })
export default async function Privacy() {
  const { business: biz } = await getSite()
  return (
    <Legal title="Privacy policy" updated="5 November 2026">
      <p>{BUSINESS.name} (&quot;Lavigo&quot;, &quot;we&quot;) runs this website from {biz.address}. This page explains what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li>When you hold seats on a group trip: your name, mobile number, optional email, the number of travellers and any traveller names you add.</li>
        <li>When you message us on WhatsApp or call: whatever you choose to tell us.</li>
        <li>Basic technical data your browser sends (such as pages visited), used to keep the site working and understand how it is used.</li>
      </ul>
      <h2>How we use it</h2>
      <p>We use your details only to hold and confirm your seats, contact you about your trip, take payment and issue invoices, and answer your questions. We do not sell your data.</p>
      <h2>Who sees it</h2>
      <p>Our team, and service providers we need to run your trip or this site (for example our database and hosting providers, and hotels or transport operators who need traveller names). Payment providers handle card and UPI details themselves; we never see or store card numbers.</p>
      <h2>How long we keep it</h2>
      <p>We keep booking records for as long as needed to run your trip and meet accounting and legal requirements.</p>
      <h2>Your choices</h2>
      <p>You can ask us to correct or delete your details by messaging {BUSINESS.phoneDisplay} on WhatsApp{biz.email ? ` or emailing ${biz.email}` : ''}. We may need to keep some records where the law requires it.</p>
    </Legal>
  )
}
