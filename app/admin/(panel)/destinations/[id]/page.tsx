import { notFound } from 'next/navigation'
import { deleteDestination, saveDestination } from '../../../actions'
import { ConfirmButton } from '@/components/admin/ConfirmButton'
import { GalleryEditor } from '@/components/admin/GalleryEditor'
import { ImageField } from '@/components/admin/ImageField'
import { RowsEditor } from '@/components/admin/RowsEditor'
import { Flash, Head } from '@/components/admin/ui'
import { getDestinationAdmin } from '@/lib/admin-data'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: (await params).id === 'new' ? 'New destination' : 'Edit destination' }
}

const num = (name: string, label: string, v?: number, hint?: string) => (
  <div className="fld"><label className="l" htmlFor={`d-${name}`}>{label}</label><input id={`d-${name}`} className="inp" type="number" min={0} name={name} defaultValue={v ?? 0} required />{hint && <p className="hint">{hint}</p>}</div>
)

export default async function DestinationEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string; ok?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const isNew = id === 'new'
  const d = isNew ? null : await getDestinationAdmin(id)
  if (!isNew && !d) notFound()
  return (
    <>
      <Head back={{ href: '/admin/destinations', label: 'Destinations' }} title={isNew ? 'New destination' : d!.name} sub={isNew ? undefined : d!.area} />
      <Flash ok={sp.ok} err={sp.err} />
      {!isNew && <nav className="ad-jump" aria-label="Sections"><a href="#basics">Basics</a><a href="#photos">Photos</a><a href="#hotels">Hotels</a><a href="#cars">Cars</a><a href="#rates">Planner rates</a><a href="#acts">Experiences</a></nav>}

      <form action={saveDestination}>
        {!isNew && <input type="hidden" name="id" value={d!.id} />}
        <section className="card pane" id="basics">
          <h2 className="ad-h2">Basics</h2>
          <div className="g3" style={{ marginTop: 12 }}>
            <div className="fld"><label className="l" htmlFor="d-name">Name</label><input id="d-name" className="inp" name="name" defaultValue={d?.name} required /></div>
            <div className="fld"><label className="l" htmlFor="d-area">Short area line</label><input id="d-area" className="inp" name="area" defaultValue={d?.area} placeholder="Pokhara · Kathmandu" /></div>
            <div className="fld"><label className="l" htmlFor="d-slug">Web address (optional)</label><input id="d-slug" className="inp" name="slug" defaultValue={d?.slug} /></div>
          </div>
          <div className="fld"><label className="l" htmlFor="d-blurb">Description</label><textarea id="d-blurb" className="inp" name="blurb" defaultValue={d?.blurb} maxLength={400} /></div>
          <div className="g3">
            <div className="fld"><label className="l" htmlFor="d-places">Places in order (comma separated)</label><input id="d-places" className="inp" name="places" defaultValue={(d?.places ?? []).join(', ')} placeholder="Pokhara, Kathmandu" /><p className="hint">The planner builds its day-by-day plan from these.</p></div>
            <div className="fld"><label className="l" htmlFor="d-nights">Suggested nights</label><input id="d-nights" className="inp" type="number" min={1} max={30} name="default_nights" defaultValue={d?.default_nights ?? 3} /></div>
            <div className="fld"><label className="l" htmlFor="d-sort">Order on the site</label><input id="d-sort" className="inp" type="number" name="sort_order" defaultValue={d?.sort_order ?? 0} /><p className="hint">Lower numbers come first.</p></div>
          </div>
          <label className="chk"><input type="checkbox" name="published" defaultChecked={d ? d.published : true} /><span><b>Show on website</b><small>Untick to hide it from the home page and the planner.</small></span></label>
        </section>

        <section className="card pane" id="photos">
          <h2 className="ad-h2">Photos</h2>
          <p className="ad-sub">The cover appears on the home page and in the planner. Gallery photos fill trip pages that have no gallery of their own, and the photo beside each itinerary day.</p>
          <label className="l">Cover photo</label>
          <ImageField name="hero_image" value={d?.hero_image ?? ''} />
          <label className="l" style={{ marginTop: 18 }}>Gallery</label>
          <GalleryEditor name="gallery_json" initial={(d?.gallery ?? []).map((g) => ({ src: g.src, caption: g.caption }))} />
        </section>

        <section className="card pane" id="hotels">
          <h2 className="ad-h2">Hotels</h2>
          <p className="ad-sub">Listed on trip pages, in the PDF itinerary, and in the planner for the stay type the customer picks. Use the real names of the hotels you book.</p>
          <RowsEditor name="hotels_json" addLabel="Add a hotel" itemLabel="Hotel" initial={(d?.hotels ?? []).map((h) => ({ name: h.name, place: h.place, tier: h.tier, stars: String(h.stars ?? ''), note: h.note ?? '' }))}
            fields={[{ key: 'name', label: 'Hotel name', placeholder: 'Hotel Lake View' }, { key: 'place', label: 'Town', placeholder: 'Pokhara' },
              { key: 'tier', label: 'Stay type', type: 'select', options: [['budget', 'Budget'], ['comfort', 'Comfort'], ['premium', 'Premium']] }, { key: 'stars', label: 'Stars', type: 'number' },
              { key: 'note', label: 'One line about it', type: 'textarea', placeholder: 'Lake-view rooms, 5 minutes to the boating point' }]} />
        </section>

        <section className="card pane" id="cars">
          <h2 className="ad-h2">Cars</h2>
          <p className="ad-sub">Vehicles used here. The planner suggests the ones that fit the group size.</p>
          <RowsEditor name="cars_json" addLabel="Add a car" itemLabel="Car" initial={(d?.cars ?? []).map((c) => ({ name: c.name, kind: c.kind, seats: String(c.seats ?? ''), note: c.note ?? '' }))}
            fields={[{ key: 'name', label: 'Car', placeholder: 'Toyota Innova Crysta' }, { key: 'kind', label: 'Type', placeholder: 'SUV' }, { key: 'seats', label: 'Seats', type: 'number' },
              { key: 'note', label: 'Used for', type: 'textarea', placeholder: 'Airport pick-up and sightseeing' }]} />
        </section>

        <section className="card pane" id="rates">
          <h2 className="ad-h2">Planner rates (private)</h2>
          <p className="ad-sub">Used to estimate custom trips. Customers see only the total, never these numbers. The planner adds meals, cars, a service fee and 5% GST.</p>
          <div className="g3">{num('rate_budget', 'Room per night · Budget (₹)', d?.rate_budget)}{num('rate_comfort', 'Room per night · Comfort (₹)', d?.rate_comfort)}{num('rate_premium', 'Room per night · Premium (₹)', d?.rate_premium)}</div>
          <div className="g3">{num('travel_train', 'Train fare per person, return (₹)', d?.travel_train, 'Only used when Lavigo books the tickets.')}{num('travel_flight', 'Flight fare per person, return (₹)', d?.travel_flight)}<input type="hidden" name="travel_cab" value={d?.travel_cab ?? 0} /></div>
        </section>

        <section className="card pane" id="acts">
          <h2 className="ad-h2">Experiences customers can add</h2>
          <p className="ad-sub">Shown as tick-boxes in the planner. The price is per person and stays private.</p>
          <RowsEditor name="activities_json" addLabel="Add an experience" itemLabel="Experience" initial={(d?.activities ?? []).map((a) => ({ n: a.n, p: String(a.p), where: a.where }))}
            fields={[{ key: 'n', label: 'Name', placeholder: 'Paragliding' }, { key: 'p', label: 'Price per person (₹)', type: 'number' }, { key: 'where', label: 'Where', placeholder: 'Pokhara' }]} />
        </section>

        <div className="ad-savebar"><span>Changes go live on the website and planner within a minute.</span><button className="btn b-main lg">{isNew ? 'Create destination' : 'Save destination'}</button></div>
      </form>

      {!isNew && (
        <form action={deleteDestination} style={{ marginTop: 24 }}>
          <input type="hidden" name="id" value={d!.id} />
          <ConfirmButton className="btn b-danger sm" message={`Delete ${d!.name}? This cannot be undone. Destinations used by a trip cannot be deleted.`}>Delete destination</ConfirmButton>
        </form>
      )}
    </>
  )
}
