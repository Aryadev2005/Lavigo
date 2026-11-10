import Link from 'next/link'
import { notFound } from 'next/navigation'
import { deleteTrip, duplicateTrip, saveTrip } from '../../../actions'
import { ConfirmButton } from '@/components/admin/ConfirmButton'
import { DepartureForm } from '@/components/admin/DepartureForm'
import { GalleryEditor } from '@/components/admin/GalleryEditor'
import { ImageField } from '@/components/admin/ImageField'
import { RowsEditor } from '@/components/admin/RowsEditor'
import { WordCountField } from '@/components/admin/WordCountField'
import { Icon } from '@/components/Icons'
import { Flash, GenderBar, Head, SeatMeter, dDay, money } from '@/components/admin/ui'
import { getTripAdmin, listDestinationsAdmin } from '@/lib/admin-data'
import { todayISO } from '@/lib/format'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: (await params).id === 'new' ? 'New trip' : 'Edit trip' }
}

export default async function TripEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ err?: string; ok?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const isNew = id === 'new'
  const [trip, dests] = await Promise.all([isNew ? null : getTripAdmin(id), listDestinationsAdmin()])
  if (!isNew && !trip) notFound()
  const t = trip
  const today = todayISO()
  const here = `/admin/trips/${id}`
  const upcoming = t?.departures.filter((d) => d.depart_date >= today) ?? []
  const past = t?.departures.filter((d) => d.depart_date < today) ?? []

  return (
    <>
      <Head back={{ href: '/admin/trips', label: 'Trips' }} title={isNew ? 'New trip' : t!.title}
        sub={isNew ? 'Fill in the basics and save. You can add photos and dates right after.' : <>{t!.published ? 'Live on the website' : 'Hidden from the website'} · /trips/{t!.slug}</>}>
        {!isNew && <a href={`/trips/${t!.slug}`} target="_blank" rel="noopener" className="btn b-ghost"><Icon name="external" size={16} />View page</a>}
        {!isNew && <form action={duplicateTrip}><input type="hidden" name="id" value={t!.id} /><button className="btn b-ghost"><Icon name="copy" size={16} />Duplicate</button></form>}
      </Head>
      <Flash ok={sp.ok} err={sp.err} />

      {!isNew && (
        <nav className="ad-jump" aria-label="Sections">
          <a href="#basics">Basics</a><a href="#photos">Photos</a><a href="#story">Story</a><a href="#days">Day by day</a><a href="#places">Places</a><a href="#included">Included</a><a href="#good-to-know">Good to know</a><a href="#faqs">Questions</a><a href="#departures">Departures</a>
        </nav>
      )}

      <form action={saveTrip}>
        {!isNew && <input type="hidden" name="id" value={t!.id} />}
        <section className="card pane" id="basics">
          <h2 className="ad-h2">Basics</h2>
          <p className="ad-sub">What visitors see first on the trip page and in Google.</p>
          <div className="g2">
            <div className="fld"><label className="l" htmlFor="t-title">Trip title</label><input id="t-title" className="inp" name="title" defaultValue={t?.title} required placeholder="Nepal group trip" /></div>
            <div className="fld"><label className="l" htmlFor="t-slug">Web address</label><input id="t-slug" className="inp" name="slug" defaultValue={t?.slug} placeholder="filled in from the title" />
              <p className="hint">lavigo.in/trips/<b>{t?.slug ?? 'your-trip'}</b>. Changing it breaks links already shared.</p></div>
          </div>
          <div className="g3">
            <div className="fld"><label className="l" htmlFor="t-dest">Destination</label>
              <select id="t-dest" className="inp" name="destination_id" defaultValue={t?.destination_id ?? ''}><option value="">None</option>{dests.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
              <p className="hint">Its hotels, cars and photos appear on the trip page.</p></div>
            <div className="fld"><label className="l" htmlFor="t-n">Nights</label><input id="t-n" className="inp" type="number" name="nights" min={0} max={30} defaultValue={t?.nights ?? 3} required /></div>
            <div className="fld"><label className="l" htmlFor="t-r">Route</label><input id="t-r" className="inp" name="route" defaultValue={t?.route} placeholder="Ranchi → NJP → Darjeeling" /></div>
          </div>
          <div className="fld"><label className="l" htmlFor="t-s">Short description</label><textarea id="t-s" className="inp" name="summary" defaultValue={t?.summary} maxLength={600} placeholder="Two or three sentences: what makes this trip special." /></div>
          <label className="chk"><input type="checkbox" name="published" defaultChecked={t ? t.published : true} /><span><b>Show on website</b><small>Untick to hide this trip without deleting it. Existing bookings are not affected.</small></span></label>
        </section>

        <section className="card pane" id="photos">
          <h2 className="ad-h2">Photos</h2>
          <p className="ad-sub">The cover photo leads the trip card and page. Gallery photos follow it in the photo grid. With no gallery, the destination&apos;s photos are used.</p>
          <label className="l">Cover photo</label>
          <ImageField name="image" value={t?.image ?? ''} />
          <label className="l" style={{ marginTop: 18 }}>Gallery</label>
          <GalleryEditor name="gallery_json" initial={(t?.gallery ?? []).map((g) => ({ src: g.src, caption: g.caption }))} />
        </section>

        <section className="card pane" id="story">
          <h2 className="ad-h2">The story</h2>
          <p className="ad-sub">3–5 paragraphs about the place: history, culture, what it feels like to be there. Shown above the itinerary, with the first paragraph highlighted.</p>
          <WordCountField name="story" defaultValue={t?.story ?? ''} placeholder="Write the story of this place…" />
          <label className="l" style={{ marginTop: 18 }}>Highlights</label>
          <p className="hint">Short phrases, shown as chips. For example &quot;Sunrise at Sarangkot&quot;.</p>
          <RowsEditor name="highlights_json" addLabel="Add a highlight" itemLabel="Highlight" initial={(t?.highlights ?? []).map((h) => ({ text: h }))}
            fields={[{ key: 'text', label: 'Highlight', placeholder: 'Sunrise at Sarangkot' }]} />
        </section>

        <section className="card pane" id="days">
          <h2 className="ad-h2">Day by day</h2>
          <p className="ad-sub">One entry per day, in order. Write a full description (2–4 paragraphs); add a photo to show it beside that day on the website and in the PDF.</p>
          <RowsEditor name="itinerary_json" addLabel="Add a day" itemLabel="Day"
            initial={(t?.itinerary ?? []).map((d) => ({ title: d.title, description: d.description ?? d.text ?? '', meals: d.meals ?? '', stay: d.stay ?? '', travel: d.travel ?? '', highlights: (d.highlights ?? []).join('\n'), image: d.image ?? '' }))}
            fields={[
              { key: 'title', label: 'Title', placeholder: 'Ranchi → Raxaul → Pokhara' },
              { key: 'meals', label: 'Meals', placeholder: 'B/D' },
              { key: 'stay', label: 'Stay (hotel/town)', placeholder: 'Pokhara' },
              { key: 'travel', label: 'Travel', placeholder: '6 h drive, 200 km' },
              { key: 'description', label: 'Full description (2–4 paragraphs)', type: 'textarea', placeholder: 'Leave Ranchi at 6 am…' },
              { key: 'highlights', label: 'Highlights for this day (one per line)', type: 'textarea', placeholder: 'Sunrise at Sarangkot' },
              { key: 'image', label: 'Photo for this day (optional)', type: 'image' },
            ]} />
        </section>

        <section className="card pane" id="places">
          <h2 className="ad-h2">Places you&apos;ll visit</h2>
          <p className="ad-sub">The towns or sights the story is about. 2–3 sentences each.</p>
          <RowsEditor name="places_json" addLabel="Add a place" itemLabel="Place" initial={(t?.places ?? []).map((p) => ({ name: p.name, about: p.about, image: p.image ?? '' }))}
            fields={[{ key: 'name', label: 'Place', placeholder: 'Pokhara' }, { key: 'about', label: 'About', type: 'textarea', placeholder: 'Two or three sentences about this place.' }, { key: 'image', label: 'Photo', type: 'image' }]} />
        </section>

        <section className="card pane" id="included">
          <h2 className="ad-h2">What&apos;s included</h2>
          <p className="ad-sub">Shown on the trip page and in the PDF itinerary. One item per line. Prices are never broken down for customers.</p>
          <div className="g2">
            <div className="fld"><label className="l" htmlFor="t-inc">Included</label><textarea id="t-inc" className="inp" name="inclusions" defaultValue={(t?.inclusions ?? []).join('\n')} style={{ minHeight: 160 }} placeholder={'Hotel stays (twin sharing)\nBreakfast and dinner'} /></div>
            <div className="fld"><label className="l" htmlFor="t-exc">Not included</label><textarea id="t-exc" className="inp" name="exclusions" defaultValue={(t?.exclusions ?? []).join('\n')} style={{ minHeight: 160 }} placeholder={'Lunch\nEntry tickets'} /></div>
          </div>
        </section>

        <section className="card pane" id="good-to-know">
          <h2 className="ad-h2">Good to know</h2>
          <p className="ad-sub">Best time to visit, weather and clothing, documents needed, currency, food, network/SIM, altitude or walking level — whatever matters for this trip.</p>
          <RowsEditor name="good_to_know_json" addLabel="Add a note" itemLabel="Note" initial={(t?.good_to_know ?? []).map((g) => ({ title: g.title, text: g.text }))}
            fields={[{ key: 'title', label: 'Title', placeholder: 'Documents' }, { key: 'text', label: 'Text', type: 'textarea', placeholder: 'Indian citizens need a passport or voter ID. No visa required.' }]} />
          <label className="l" style={{ marginTop: 18 }}>Things to carry</label>
          <textarea className="inp" name="things_to_carry" defaultValue={(t?.things_to_carry ?? []).join('\n')} style={{ minHeight: 120 }} placeholder={'Warm jacket\nComfortable walking shoes'} />
          <p className="hint">One item per line.</p>
        </section>

        <section className="card pane" id="faqs">
          <h2 className="ad-h2">Questions &amp; answers</h2>
          <p className="ad-sub">Help visitors, Google and AI assistants answer questions about this trip.</p>
          <RowsEditor name="faqs_json" addLabel="Add a question" itemLabel="Question" initial={(t?.faqs ?? []).map((f) => ({ q: f.q, a: f.a }))}
            fields={[{ key: 'q', label: 'Question' }, { key: 'a', label: 'Answer', type: 'textarea' }]} />
        </section>

        <div className="ad-savebar">
          <span>{isNew ? 'Create the trip, then add photos and dates.' : 'Changes go live on the website within a minute of saving.'}</span>
          <button className="btn b-main lg">{isNew ? 'Create trip' : 'Save trip'}</button>
        </div>
      </form>

      {!isNew && (
        <section className="ad-sec" id="departures">
          <h2 className="ad-h2">Departures</h2>
          <p className="ad-sub">Customers can only book dates listed here. Each date has its own price, seats and starting city. Open one to see who is travelling.</p>
          <div className="card ad-scroll" style={{ marginBottom: 14 }}>
            {upcoming.length === 0 ? <div className="ad-empty"><b>No upcoming dates</b>Add the next departure below so customers can book.</div> : (
              <table className="ad-tbl">
                <thead><tr><th>Date</th><th>From</th><th className="num">Price</th><th style={{ minWidth: 200 }}>Seats</th><th>Travellers</th><th>Booking</th><th></th></tr></thead>
                <tbody>
                  {upcoming.map((d) => (
                    <tr key={d.id}>
                      <td><b>{dDay(d.depart_date)}</b></td>
                      <td>{d.start_city}</td>
                      <td className="num">{money(d.price)}</td>
                      <td><SeatMeter total={d.seats_total} confirmed={d.stats.confirmedSeats} held={d.stats.heldSeats} /></td>
                      <td><GenderBar g={d.stats.genders} /></td>
                      <td><span className={'pill ' + d.status}>{d.status === 'open' ? 'Open' : 'Closed'}</span></td>
                      <td><Link href={`/admin/departures/${d.id}`} className="btn b-ghost sm">Open</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="card pane">
            <h2 className="ad-h2" style={{ fontSize: 17 }}>Add a departure</h2>
            <DepartureForm tripId={t!.id} back={`${here}#departures`} minDate={today} />
          </div>
          {past.length > 0 && <p className="hint" style={{ marginTop: 10 }}>{past.length} past departure{past.length > 1 ? 's' : ''}: see <Link href="/admin/departures?when=past" style={{ color: 'var(--ink3)' }}>Departures → Past</Link>.</p>}

          <form action={deleteTrip} style={{ marginTop: 28 }}>
            <input type="hidden" name="id" value={t!.id} />
            <ConfirmButton className="btn b-danger sm" message={`Delete "${t!.title}" and all its dates? This cannot be undone. Trips with bookings cannot be deleted.`}>Delete this trip</ConfirmButton>
          </form>
        </section>
      )}
    </>
  )
}
