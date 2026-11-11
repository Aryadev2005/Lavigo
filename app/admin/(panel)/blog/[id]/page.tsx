import { notFound } from 'next/navigation'
import { deletePost, savePost } from '../../../actions'
import { ConfirmButton } from '@/components/admin/ConfirmButton'
import { ImageField } from '@/components/admin/ImageField'
import { MediaEditor } from '@/components/admin/MediaEditor'
import { Flash, Head } from '@/components/admin/ui'
import { Icon } from '@/components/Icons'
import { getPostAdmin } from '@/lib/admin-extra'
import { listTripsAdmin } from '@/lib/admin-data'

export const metadata = { title: 'Story' }

export default async function PostEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams])
  const isNew = id === 'new'
  const [p, trips] = await Promise.all([isNew ? null : getPostAdmin(id), listTripsAdmin()])
  if (!isNew && !p) notFound()
  return (
    <>
      <Head back={{ href: '/admin/blog', label: 'Travel stories' }} title={isNew ? 'New story' : p!.title}
        sub={isNew ? 'Write it, add photos and videos with captions, then publish.' : p!.published ? <>Live at /blog/{p!.slug}</> : 'Draft: not on the website yet'}>
        {!isNew && p!.published && <a href={`/blog/${p!.slug}`} target="_blank" rel="noopener" className="btn b-ghost"><Icon name="external" size={16} />View story</a>}
      </Head>
      <Flash ok={sp.ok} err={sp.err} />
      <form action={savePost}>
        {!isNew && <input type="hidden" name="id" value={p!.id} />}
        <section className="card pane">
          <h2 className="ad-h2">The story</h2>
          <div className="g2">
            <div className="fld"><label className="l" htmlFor="p-title">Title</label><input id="p-title" className="inp" name="title" required defaultValue={p?.title} placeholder="Five days, two lakes and one cable car: Nepal with the group" /></div>
            <div className="fld"><label className="l" htmlFor="p-slug">Web address</label><input id="p-slug" className="inp" name="slug" defaultValue={p?.slug} placeholder="filled in from the title" /><p className="hint">lavigo.in/blog/<b>{p?.slug ?? 'your-story'}</b></p></div>
          </div>
          <div className="g3">
            <div className="fld"><label className="l" htmlFor="p-place">Place</label><input id="p-place" className="inp" name="place" defaultValue={p?.place} placeholder="Nepal" /></div>
            <div className="fld"><label className="l" htmlFor="p-trip">Linked trip (for the &quot;Book now&quot; button)</label>
              <select id="p-trip" className="inp" name="trip_id" defaultValue={p?.trip_id ?? ''}><option value="">None</option>{trips.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}</select></div>
            <div className="fld"><label className="l" htmlFor="p-date">Date shown</label><input id="p-date" className="inp" type="date" name="published_at" defaultValue={p?.published_at ?? ''} /></div>
          </div>
          <div className="fld"><label className="l" htmlFor="p-ex">Short introduction</label><textarea id="p-ex" className="inp" name="excerpt" maxLength={400} defaultValue={p?.excerpt} placeholder="One or two sentences, shown on the blog page and in Google." /></div>
          <div className="fld"><label className="l" htmlFor="p-body">Story text</label>
            <textarea id="p-body" className="inp" name="body" defaultValue={p?.body} style={{ minHeight: 280 }} placeholder={'Write in paragraphs. Leave an empty line between paragraphs.\n\n## A line starting with ## becomes a heading\n\n> A line starting with > becomes a highlighted quote'} />
            <p className="hint">Photos and videos below are placed between your paragraphs, in order.</p></div>
          <label className="l">Cover photo</label>
          <ImageField name="cover" value={p?.cover ?? ''} />
        </section>

        <section className="card pane">
          <h2 className="ad-h2">Photos &amp; videos</h2>
          <p className="ad-sub">Every photo and video has its own description. Drag order with the arrows.</p>
          <MediaEditor name="media_json" initial={(p?.media ?? []).map((m) => ({ type: m.type, src: m.src, poster: m.poster, caption: m.caption }))} />
        </section>

        <div className="ad-savebar">
          <label className="chk" style={{ margin: 0 }}><input type="checkbox" name="published" defaultChecked={p?.published ?? false} /><span><b>Publish on the website</b></span></label>
          <button className="btn b-main lg">{isNew ? 'Save story' : 'Save changes'}</button>
        </div>
      </form>
      {!isNew && (
        <form action={deletePost} style={{ marginTop: 18 }}>
          <input type="hidden" name="id" value={p!.id} />
          <ConfirmButton className="btn b-danger sm" message="Delete this story? This cannot be undone.">Delete story</ConfirmButton>
        </form>
      )}
    </>
  )
}
