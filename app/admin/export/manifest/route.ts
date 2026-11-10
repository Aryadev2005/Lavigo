import { getAdmin } from '@/lib/admin-auth'
import { getDeparture, takesSeats, travellersOf } from '@/lib/admin-data'
import { csvResponse, toCsv } from '@/lib/csv'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response('Please sign in', { status: 401 })
  const id = new URL(req.url).searchParams.get('departure') ?? ''
  const found = id ? await getDeparture(id) : null
  if (!found) return new Response('Departure not found', { status: 404 })
  const { departure: d, bookings } = found
  const out: (string | number | null)[][] = [['#', 'Traveller', 'Gender', 'Lead traveller', 'Booking code', 'Status', 'Phone', 'Email', 'Tickets', 'Travelling from', 'Paid (INR)', 'Total (INR)', 'Note']]
  let n = 0
  for (const b of bookings.filter(takesSeats)) {
    for (const t of travellersOf(b)) {
      out.push([++n, t.name, t.gender ? (t.gender === 'male' ? 'Male' : 'Female') : '', t.lead ? 'Yes' : '', b.code, b.status === 'held' ? 'On hold' : 'Confirmed', b.phone, b.email,
        b.ticket_by === 'self' ? 'Own' : b.passengers?.length ? 'Lavigo' : '', b.from_city ?? '', t.lead ? b.amount_paid : '', t.lead ? b.amount_total : '', t.lead ? b.admin_note ?? '' : ''])
    }
  }
  const slug = d.trip.slug.slice(0, 40)
  return csvResponse(`lavigo-${slug}-${d.depart_date}-travellers.csv`, toCsv(out))
}
