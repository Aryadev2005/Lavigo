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
        <p className="muted" style={{ fontSize: 13.5 }}>Room prices are per room per night. Travel is per person from Ranchi. The planner adds meals, a service fee and 5% GST.</p>
        <div className="grid3">{num('rate_budget', 'Room · Budget', d?.rate_budget)}{num('rate_comfort', 'Room · Comfort', d?.rate_comfort)}{num('rate_premium', 'Room · Premium', d?.rate_premium)}</div>
        <div className="grid3">{num('travel_train', 'Travel · Train + shared cab', d?.travel_train)}{num('travel_cab', 'Travel · Train + private cab', d?.travel_cab)}{num('travel_flight', 'Travel · Flight + private cab', d?.travel_flight)}</div>
        <div className="grid2">
          <div><label className="l">Suggested nights</label><input className="inp" type="number" min={1} max={30} name="default_nights" defaultValue={d?.default_nights ?? 3} /></div>
          <div><label className="l">Places in order (comma separated)</label><input className="inp" name="places" defaultValue={(d?.places ?? []).join(', ')} placeholder="Pokhara, Kathmandu" /></div>
        </div>

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
