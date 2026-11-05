import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteDeparture, deleteTrip, saveDeparture, saveTrip } from '../../../actions'
import { ConfirmButton } from '@/components/admin/ConfirmButton'
import { ImageField } from '@/components/admin/ImageField'
import { RowsEditor } from '@/components/admin/RowsEditor'
import { getTripAdmin, listDestinationsAdmin } from '@/lib/admin-data'
import { fmtDate, todayISO } from '@/lib/format'

export default async function TripEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string; ok?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const isNew = id === 'new'
  const [trip, dests] = await Promise.all([isNew ? null : getTripAdmin(id), listDestinationsAdmin()])
  if (!isNew && !trip) notFound()
  const t = trip
  const today = todayISO()

  return (
    <>
      <p className="crumbs" style={{ padding: 0, marginBottom: 6 }}><Link href="/admin/trips">← All trips</Link></p>
      <h1>{isNew ? 'New trip' : t!.title}</h1>
      {sp.err && <div className="errbox" role="alert">{sp.err}</div>}
      {sp.ok && <div className="okbox" role="status">{sp.ok}</div>}

      <form action={saveTrip} className="card pane" style={{ marginTop: 14 }}>
        {!isNew && <input type="hidden" name="id" value={t!.id} />}
        <div className="grid2">
          <div><label className="l">Trip title</label><input className="inp" name="title" defaultValue={t?.title} required placeholder="Nepal Trip from Ranchi" /></div>
          <div><label className="l">Web address (leave blank to auto-fill)</label><input className="inp" name="slug" defaultValue={t?.slug} placeholder="nepal-trip-from-ranchi" /></div>
        </div>
        <div className="grid3">
          <div><label className="l">Destination</label>
            <select className="inp" name="destination_id" defaultValue={t?.destination_id ?? ''}><option value="">None</option>{dests.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div><label className="l">Nights</label><input className="inp" type="number" name="nights" min={0} max={30} defaultValue={t?.nights ?? 3} required /></div>
          <div><label className="l">Route</label><input className="inp" name="route" defaultValue={t?.route} placeholder="Ranchi → NJP → Darjeeling" /></div>
        </div>
        <label className="l">Short description (shown on the page and to Google)</label>
        <textarea className="inp" name="summary" defaultValue={t?.summary} />
        <label className="l">Main photo</label>
        <ImageField name="image" value={t?.image ?? ''} />

        <label className="l" style={{ marginTop: 16 }}>Day-by-day itinerary</label>
        <RowsEditor name="itinerary_json" addLabel="Add a day" initial={(t?.itinerary ?? []).map((d) => ({ title: d.title, text: d.text }))}
          fields={[{ key: 'title', label: 'Day title', placeholder: 'Ranchi → Raxaul → Pokhara' }, { key: 'text', label: 'What happens', type: 'textarea' }]} />

        <div className="grid2">
          <div><label className="l">Included (one per line)</label><textarea className="inp" name="inclusions" defaultValue={(t?.inclusions ?? []).join('\n')} /></div>
          <div><label className="l">Not included (one per line)</label><textarea className="inp" name="exclusions" defaultValue={(t?.exclusions ?? []).join('\n')} /></div>
        </div>

        <label className="l" style={{ marginTop: 6 }}>Questions &amp; answers (helps Google and AI assistants answer about this trip)</label>
        <RowsEditor name="faqs_json" addLabel="Add a question" initial={(t?.faqs ?? []).map((f) => ({ q: f.q, a: f.a }))}
          fields={[{ key: 'q', label: 'Question' }, { key: 'a', label: 'Answer', type: 'textarea' }]} />

        <label className="act" style={{ marginTop: 16, display: 'flex' }}><input type="checkbox" name="published" defaultChecked={t ? t.published : true} /><span className="x"><b>Show on website</b><small>Untick to hide this trip without deleting it.</small></span></label>
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          <button className="btn b-main">{isNew ? 'Create trip' : 'Save trip'}</button>
        </div>
      </form>

      {!isNew && (
        <>
          <h2 id="departures" style={{ margin: '28px 0 6px' }}>Departures (date, price, seats)</h2>
          <p className="muted" style={{ marginBottom: 12 }}>Customers can only book dates listed here. &quot;Left&quot; updates by itself as people book. Price is per person, including GST.</p>
          <div className="card tbl-scroll"><table>
            <thead><tr><th>Date</th><th>Price (₹)</th><th>Total seats</th><th>Status</th><th>Booked / held / left</th><th></th></tr></thead>
            <tbody>
              {t!.departures.map((d) => (
                <tr key={d.id} style={d.depart_date < today ? { opacity: 0.55 } : undefined}>
                  <td colSpan={4} style={{ padding: 0 }}>
                    <form action={saveDeparture} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr auto', gap: 8, padding: '10px 12px', alignItems: 'center' }}>
                      <input type="hidden" name="id" value={d.id} /><input type="hidden" name="trip_id" value={t!.id} />
                      <input className="inp sm" type="date" name="depart_date" defaultValue={d.depart_date} required aria-label="Departure date" />
                      <input className="inp sm" type="number" name="price" min={0} defaultValue={d.price} required aria-label="Price per person" />
                      <input className="inp sm" type="number" name="seats_total" min={0} defaultValue={d.seats_total} required aria-label="Total seats" />
                      <select className="inp sm" name="status" defaultValue={d.status} aria-label="Status"><option value="open">Open</option><option value="closed">Closed</option></select>
                      <button className="btn b-ghost sm">Save</button>
                    </form>
                  </td>
                  <td>{d.taken - d.held} / {d.held} / <b>{d.seats_left}</b></td>
                  <td><form action={deleteDeparture}><input type="hidden" name="id" value={d.id} /><input type="hidden" name="trip_id" value={t!.id} /><ConfirmButton className="btn b-danger sm" message={`Delete the ${fmtDate(d.depart_date, { day: 'numeric', month: 'short', year: 'numeric' })} departure?`}>Delete</ConfirmButton></form></td>
                </tr>
              ))}
              <tr>
                <td colSpan={4} style={{ padding: 0 }}>
                  <form action={saveDeparture} style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr auto', gap: 8, padding: '10px 12px', alignItems: 'center', background: 'var(--lav3)' }}>
                    <input type="hidden" name="trip_id" value={t!.id} />
                    <input className="inp sm" type="date" name="depart_date" min={today} required aria-label="New departure date" />
                    <input className="inp sm" type="number" name="price" min={0} placeholder="Price" required aria-label="Price per person" />
                    <input className="inp sm" type="number" name="seats_total" min={0} placeholder="Seats" required aria-label="Total seats" />
                    <select className="inp sm" name="status" aria-label="Status"><option value="open">Open</option><option value="closed">Closed</option></select>
                    <button className="btn b-main sm">+ Add date</button>
                  </form>
                </td>
                <td colSpan={2}></td>
              </tr>
            </tbody>
          </table></div>

          <form action={deleteTrip} style={{ marginTop: 28 }}>
            <input type="hidden" name="id" value={t!.id} />
            <ConfirmButton className="btn b-danger sm" message={`Delete "${t!.title}" and all its dates? This cannot be undone.`}>Delete this trip</ConfirmButton>
          </form>
        </>
      )}
    </>
  )
}
