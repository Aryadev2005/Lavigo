import type { Metadata } from 'next'
import { Planner } from '@/components/Planner'
import { getDestinations } from '@/lib/data'
import { todayISO } from '@/lib/format'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Plan a custom trip from Ranchi',
  description: 'Build your own trip from Ranchi: choose places, nights, stay type, travel mode and activities. See a day-by-day plan and a price estimate with GST.',
  alternates: { canonical: '/plan' },
}

export default async function Plan({ searchParams }: { searchParams: Promise<{ dest?: string; date?: string; pax?: string }> }) {
  const [dests, sp] = await Promise.all([getDestinations(), searchParams])
  const pax = Number(sp.pax)
  return (
    <section style={{ paddingTop: 28 }}><div className="wrap">
      <div className="eyebrow">Custom trip</div>
      <h1 style={{ fontSize: 'clamp(28px,4.5vw,40px)', letterSpacing: '-.02em', marginBottom: 6 }}>Plan your trip</h1>
      <p className="muted" style={{ marginBottom: 20 }}>Everything on the right updates as you choose. Nothing is charged here: you get the final quote on WhatsApp.</p>
      <Planner
        destinations={dests}
        minDate={todayISO()}
        initial={{ dest: sp.dest, date: /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? '') ? sp.date : undefined, pax: Number.isFinite(pax) && pax > 0 ? pax : undefined }}
      />
    </div></section>
  )
}
