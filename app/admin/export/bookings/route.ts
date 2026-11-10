import { getAdmin } from '@/lib/admin-auth'
import { listBookings, travellersOf } from '@/lib/admin-data'
import { csvResponse, toCsv } from '@/lib/csv'
import { todayISO } from '@/lib/format'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  if (!(await getAdmin())) return new Response('Please sign in', { status: 401 })
  const u = new URL(req.url).searchParams
  const rows = await listBookings({ status: u.get('status') || 'active', q: u.get('q') ?? undefined, departure: u.get('departure') ?? undefined, pay: u.get('pay') ?? undefined, source: u.get('source') ?? undefined })
  const out: (string | number | null)[][] = [['Booking code', 'Status', 'Payment', 'Made by', 'Booked on', 'Trip', 'Departure date', 'Starts from', 'Lead name', 'Phone', 'Email', 'Travellers', 'Male', 'Female', 'Gender not given', 'All travellers', 'Tickets', 'Travelling from', 'Total (INR)', 'Paid (INR)', 'Balance (INR)', 'Hold lapses', 'Note']]
  for (const b of rows) {
    const t = travellersOf(b)
    out.push([b.code, b.status, b.payment_status ?? '', b.source === 'admin' ? 'Office' : 'Website', b.created_at.slice(0, 10), b.departure.trip.title, b.departure.depart_date, b.departure.start_city ?? '',
      b.name, b.phone, b.email, b.travellers, t.filter((x) => x.gender === 'male').length, t.filter((x) => x.gender === 'female').length, t.filter((x) => !x.gender).length,
      t.map((x) => `${x.name}${x.gender ? ` (${x.gender === 'male' ? 'M' : 'F'})` : ''}`).join('; '),
      b.ticket_by === 'self' ? 'Own' : b.passengers?.length ? 'Lavigo' : '', b.from_city ?? '',
      b.amount_total, b.amount_paid, Math.max(0, b.amount_total - b.amount_paid), b.status === 'held' ? b.hold_expires_at : '', b.admin_note ?? ''])
  }
  return csvResponse(`lavigo-bookings-${todayISO()}.csv`, toCsv(out))
}
