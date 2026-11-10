import { saveDeparture } from '@/app/admin/actions'

type Dep = { id: string; trip_id: string; depart_date: string; price: number; seats_total: number; status: 'open' | 'closed'; start_city?: string }

/** Add or edit one departure. With `trips`, the owner picks the trip (used on the Departures page). */
export function DepartureForm({ dep, tripId, trips, back, minDate }: { dep?: Dep; tripId?: string; trips?: { id: string; title: string }[]; back: string; minDate?: string }) {
  return (
    <form action={saveDeparture}>
      {dep && <input type="hidden" name="id" value={dep.id} />}
      {!trips && <input type="hidden" name="trip_id" value={dep?.trip_id ?? tripId} />}
      <input type="hidden" name="back" value={back} />
      <div className={trips ? 'g3' : 'g4'}>
        {trips && (
          <div className="fld" style={{ gridColumn: '1 / -1' }}><label className="l">Trip</label>
            <select className="inp" name="trip_id" required defaultValue=""><option value="" disabled>Choose a trip…</option>{trips.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
        )}
        <div className="fld"><label className="l">Departure date</label><input className="inp" type="date" name="depart_date" defaultValue={dep?.depart_date} min={dep ? undefined : minDate} required /></div>
        <div className="fld"><label className="l">Starts from (city)</label><input className="inp" name="start_city" defaultValue={dep?.start_city ?? ''} placeholder="Ranchi" /></div>
        <div className="fld"><label className="l">Price per person (₹, incl. GST)</label><input className="inp" type="number" name="price" min={0} defaultValue={dep?.price} required /></div>
        <div className="fld"><label className="l">Total seats</label><input className="inp" type="number" name="seats_total" min={1} max={500} defaultValue={dep?.seats_total} required /></div>
        <div className="fld"><label className="l">Booking</label>
          <select className="inp" name="status" defaultValue={dep?.status ?? 'open'}><option value="open">Open: customers can book</option><option value="closed">Closed: hidden from booking</option></select></div>
      </div>
      <button className="btn b-main">{dep ? 'Save departure' : 'Add departure'}</button>
    </form>
  )
}
