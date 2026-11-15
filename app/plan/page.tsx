import type { Metadata } from 'next'
import Link from 'next/link'
import { EnquiryForm } from '@/components/EnquiryForm'
import { Planner } from '@/components/Planner'
import { getDestinations } from '@/lib/data'
import { todayISO } from '@/lib/format'
import { pageMeta } from '@/lib/seo'

export const revalidate = 60
export const metadata: Metadata = pageMeta({
  title: 'Plan a custom trip from your city',
  description: 'Build a private trip from any city in India: pick places, nights, hotels and cars, see a day-by-day plan with a price estimate, and download the itinerary.',
  path: '/plan',
})

export default async function Plan({ searchParams }: { searchParams: Promise<{ dest?: string; date?: string; pax?: string; from?: string }> }) {
  const [dests, sp] = await Promise.all([getDestinations(), searchParams])
  const pax = Number(sp.pax)
  return (
    <div className="m-page">
      <div className="m-wrap pl-page">
        <nav className="m-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> › Custom trip</nav>
        <h1 className="pl-title">Plan your trip</h1>
        <p className="m-muted pl-lead">Start from any city in India. Your plan and estimate update as you choose. Nothing is charged here: you get the final quote on WhatsApp.</p>
        <p className="pl-skip">Rather just tell us what you want? <a href="#enquire">Send an enquiry to the owner</a> and get a plan back on WhatsApp.</p>
        <Planner
          destinations={dests}
          minDate={todayISO()}
          initial={{
            dest: sp.dest,
            date: /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? '') ? sp.date : undefined,
            pax: Number.isFinite(pax) && pax > 0 ? pax : undefined,
            from: typeof sp.from === 'string' ? sp.from.slice(0, 60) : undefined,
          }}
        />
        <section id="enquire" className="pl-enq">
          <div className="pl-enq-t">
            <p className="lv-eyebrow">Custom trip enquiry</p>
            <h2>Tell us your trip. <em>We plan the rest.</em></h2>
            <p>Anywhere in India or abroad, any dates, any group size. Your enquiry goes straight to the owner, who replies on WhatsApp with a day-by-day plan and a quote.</p>
          </div>
          <EnquiryForm kind="custom" destinations={dests.map((d) => d.name)} />
        </section>
      </div>
    </div>
  )
}
