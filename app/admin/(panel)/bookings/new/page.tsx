import { Flash, Head, dDay } from '@/components/admin/ui'
import { NewBookingForm } from '@/components/admin/NewBookingForm'
import { bookableDepartures } from '@/lib/admin-data'

export const metadata = { title: 'New booking' }

export default async function NewBooking({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string; departure?: string }> }) {
  const [sp, deps] = await Promise.all([searchParams, bookableDepartures()])
  return (
    <>
      <Head back={{ href: '/admin/bookings', label: 'Bookings' }} title="New booking" sub="For customers who book on the phone, on WhatsApp or at the office. Seats are taken from the same pool as the website, so nothing is double-booked." />
      <Flash ok={sp.ok} err={sp.err} />
      <NewBookingForm preselect={sp.departure}
        deps={deps.map((d) => ({ id: d.id, label: `${dDay(d.depart_date)} · ${d.trip.title}`, price: d.price, seatsLeft: d.stats.seatsLeft, startCity: d.start_city }))} />
    </>
  )
}
