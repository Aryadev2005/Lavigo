import type { Metadata } from 'next'
import Link from 'next/link'
import { Planner } from '@/components/Planner'
import { getDestinations } from '@/lib/data'
import { todayISO } from '@/lib/format'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Plan a custom trip from your city',
  description: 'Build your own trip from anywhere in India: choose your starting city, places, nights, hotels, cars and activities. See a day-by-day plan and a price estimate, then download the itinerary.',
  alternates: { canonical: '/plan' },
}

export default async function Plan({ searchParams }: { searchParams: Promise<{ dest?: string; date?: string; pax?: string; from?: string }> }) {
  const [dests, sp] = await Promise.all([getDestinations(), searchParams])
  const pax = Number(sp.pax)
  return (
    <div className="m-page">
      <div className="m-wrap pl-page">
        <nav className="m-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> › Custom trip</nav>
        <h1 className="pl-title">Plan your trip</h1>
        <p className="m-muted pl-lead">Start from any city in India. Your plan and estimate update as you choose. Nothing is charged here: you get the final quote on WhatsApp.</p>
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
      </div>
    </div>
  )
}
