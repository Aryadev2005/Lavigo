import Link from 'next/link'
import { notFound } from 'next/navigation'
import { saveDestination } from '../../../actions'
import { ImageField } from '@/components/admin/ImageField'
import { RowsEditor } from '@/components/admin/RowsEditor'
import { getDestinationAdmin } from '@/lib/admin-data'

const num = (name: string, label: string, v?: number) => (
  <div><label className="l">{label}</label><input className="inp" type="number" min={0} name={name} defaultValue={v ?? 0} required /></div>
)

export default async function DestinationEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string; ok?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const isNew = id === 'new'
  const d = isNew ? null : await getDestinationAdmin(id)
  if (!isNew && !d) notFound()
  return (
    <>
      <p className="crumbs" style={{ padding: 0, marginBottom: 6 }}><Link href="/admin/destinations">← All destinations</Link></p>
      <h1>{isNew ? 'New destination' : d!.name}</h1>
      {sp.err && <div className="errbox" role="alert">{sp.err}</div>}
      {sp.ok && <div className="okbox" role="status">{sp.ok}</div>}
      <form action={saveDestination} className="card pane" style={{ marginTop: 14 }}>
        {!isNew && <input type="hidden" name="id" value={d!.id} />}
        <div className="grid3">
          <div><label className="l">Name</label><input className="inp" name="name" defaultValue={d?.name} required /></div>
          <div><label className="l">Web address (optional)</label><input className="inp" name="slug" defaultValue={d?.slug} /></div>
          <div><label className="l">Short area line</label><input className="inp" name="area" defaultValue={d?.area} placeholder="Pokhara · Kathmandu" /></div>
        </div>
        <label className="l">Description</label><textarea className="inp" name="blurb" defaultValue={d?.blurb} />
        <label className="l">Cover photo</label><ImageField name="hero_image" value={d?.hero_image ?? ''} />

        <h3 style={{ margin: '22px 0 4px' }}>Planner prices (₹)</h3>
        <p className="muted" style={{ fontSize: 13.5 }}>Room prices are per room per night. Travel is a typical return train or flight fare per person from major cities (used only when the customer asks Lavigo to book tickets). The planner adds meals, cars, a service fee and 5% GST. Customers see only the total, never these numbers.</p>
        <div className="grid3">{num('rate_budget', 'Room · Budget', d?.rate_budget)}{num('rate_comfort', 'Room · Comfort', d?.rate_comfort)}{num('rate_premium', 'Room · Premium', d?.rate_premium)}</div>
        <div className="grid3">{num('travel_train', 'Train fare per person (return)', d?.travel_train)}{num('travel_flight', 'Flight fare per person (return)', d?.travel_flight)}<input type="hidden" name="travel_cab" value={d?.travel_cab ?? 0} /></div>
        <div className="grid2">
          <div><label className="l">Suggested nights</label><input className="inp" type="number" min={1} max={30} name="default_nights" defaultValue={d?.default_nights ?? 3} /></div>
          <div><label className="l">Places in order (comma separated)</label><input className="inp" name="places" defaultValue={(d?.places ?? []).join(', ')} placeholder="Pokhara, Kathmandu" /></div>
        </div>

        <h3 style={{ margin: '22px 0 4px' }}>Hotels</h3>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 8 }}>Shown on trip pages and in the planner (for the stay type the customer picks). Use the real hotel names you book.</p>
        <RowsEditor name="hotels_json" addLabel="Add a hotel" initial={(d?.hotels ?? []).map((h) => ({ name: h.name, place: h.place, tier: h.tier, stars: String(h.stars ?? ''), note: h.note ?? '' }))}
          fields={[{ key: 'name', label: 'Hotel name', placeholder: 'Hotel Lake View' }, { key: 'place', label: 'Town', placeholder: 'Pokhara' },
            { key: 'tier', label: 'Stay type', type: 'select', options: [['budget', 'Budget'], ['comfort', 'Comfort'], ['premium', 'Premium']] }, { key: 'stars', label: 'Stars', type: 'number' },
            { key: 'note', label: 'One line about it', type: 'textarea', placeholder: 'Lake-view rooms, 5 minutes to the boating point' }]} />

        <h3 style={{ margin: '22px 0 4px' }}>Cars</h3>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 8 }}>Vehicles used at this destination. The planner suggests the ones that fit the group.</p>
        <RowsEditor name="cars_json" addLabel="Add a car" initial={(d?.cars ?? []).map((c) => ({ name: c.name, kind: c.kind, seats: String(c.seats ?? ''), note: c.note ?? '' }))}
          fields={[{ key: 'name', label: 'Car', placeholder: 'Toyota Innova Crysta' }, { key: 'kind', label: 'Type', placeholder: 'SUV' }, { key: 'seats', label: 'Seats', type: 'number' },
            { key: 'note', label: 'Used for', type: 'textarea', placeholder: 'Airport pick-up and sightseeing' }]} />

        <h3 style={{ margin: '22px 0 8px' }}>Experiences customers can add</h3>
        <RowsEditor name="activities_json" addLabel="Add an experience" initial={(d?.activities ?? []).map((a) => ({ n: a.n, p: String(a.p), where: a.where }))}
          fields={[{ key: 'n', label: 'Name', placeholder: 'Phewa Lake boating' }, { key: 'p', label: 'Price per person (₹, 0 = free)', type: 'number' }, { key: 'where', label: 'Where', placeholder: 'Pokhara' }]} />

        <h3 style={{ margin: '22px 0 8px' }}>Photo gallery</h3>
        <RowsEditor name="gallery_json" addLabel="Add a photo" initial={(d?.gallery ?? []).map((g) => ({ src: g.src, caption: g.caption }))}
          fields={[{ key: 'src', label: 'Photo', type: 'image' }, { key: 'caption', label: 'Caption', placeholder: 'Swayambhunath at dusk' }]} />

        <label className="act" style={{ marginTop: 16, display: 'flex' }}><input type="checkbox" name="published" defaultChecked={d ? d.published : true} /><span className="x"><b>Show on website</b><small>Controls the planner, the home page and the gallery.</small></span></label>
        <button className="btn b-main" style={{ marginTop: 14 }}>{isNew ? 'Create destination' : 'Save destination'}</button>
      </form>
    </>
  )
}
