import { DatePicker } from '@/components/Pickers'
import { saveDeparture } from '@/app/admin/actions'
import type { Cab } from '@/lib/types'
import { ImageField } from './ImageField'

type Dep = { id: string; trip_id: string; depart_date: string; price: number; seats_total: number; status: 'open' | 'closed'; start_city?: string; cab?: Cab }

/** Add or edit one departure. With `trips`, the owner picks the trip (used on the Departures page). */
export function DepartureForm({ dep, tripId, trips, back, minDate, withCab }: { dep?: Dep; tripId?: string; trips?: { id: string; title: string }[]; back: string; minDate?: string; withCab?: boolean }) {
  const cab = dep?.cab ?? {}
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
        <div className="fld"><label className="l">Departure date</label><DatePicker name="depart_date" defaultValue={dep?.depart_date} min={dep ? undefined : minDate} required ariaLabel="Departure date" /></div>
        <div className="fld"><label className="l">Starts from (city)</label><input className="inp" name="start_city" defaultValue={dep?.start_city ?? ''} placeholder="Ranchi" /></div>
        <div className="fld"><label className="l">Price per person (₹, incl. GST)</label><input className="inp" type="number" name="price" min={0} defaultValue={dep?.price} required /></div>
        <div className="fld"><label className="l">Total seats</label><input className="inp" type="number" name="seats_total" min={1} max={500} defaultValue={dep?.seats_total} required /></div>
        <div className="fld"><label className="l">Booking</label>
          <select className="inp" name="status" defaultValue={dep?.status ?? 'open'}><option value="open">Open: customers can book</option><option value="closed">Closed: hidden from booking</option></select></div>
      </div>
      {dep && withCab && (
        <fieldset className="ad-cab" id="cab">
          <legend>The cab for this date</legend>
          <p className="hint" style={{ marginTop: 0 }}>Confirmed travellers see these details (and the photo) on their booking page, so they know which vehicle to look for.</p>
          <div className="g3">
            <div className="fld"><label className="l">Vehicle</label><input className="inp" name="cab_vehicle" defaultValue={cab.vehicle ?? ''} placeholder="Tempo Traveller, 12 seats" /></div>
            <div className="fld"><label className="l">Number plate</label><input className="inp" name="cab_number" defaultValue={cab.number ?? ''} placeholder="JH 01 AB 1234" /></div>
            <div className="fld"><label className="l">Driver</label><input className="inp" name="cab_driver" defaultValue={cab.driver ?? ''} placeholder="Driver's name" /></div>
            <div className="fld"><label className="l">Driver&apos;s phone</label><input className="inp" name="cab_phone" defaultValue={cab.driver_phone ?? ''} inputMode="numeric" placeholder="10-digit mobile" /></div>
            <div className="fld" style={{ gridColumn: 'span 2' }}><label className="l">Pick-up point and time</label><input className="inp" name="cab_pickup" defaultValue={cab.pickup ?? ''} placeholder="Ranchi Railway Station, 6:00 am" /></div>
          </div>
          <div className="fld"><label className="l">Note for travellers</label><input className="inp" name="cab_note" defaultValue={cab.note ?? ''} placeholder="Luggage carrier on the roof; one big bag per person" /></div>
          <label className="l">Photo of the cab</label>
          <ImageField name="cab_image" value={cab.image ?? ''} />
        </fieldset>
      )}
      <button className="btn b-main">{dep ? 'Save departure' : 'Add departure'}</button>
    </form>
  )
}
