import { saveSite } from '../../actions'
import { GalleryEditor } from '@/components/admin/GalleryEditor'
import { RowsEditor } from '@/components/admin/RowsEditor'
import { Icon } from '@/components/Icons'
import { Flash, Head } from '@/components/admin/ui'
import { BUSINESS } from '@/lib/config'
import { ImageField } from '@/components/admin/ImageField'
import { DEFAULT_ABOUT, DEFAULT_BUSINESS, DEFAULT_HOME, getSite } from '@/lib/site'

export const metadata = { title: 'Site content' }

export default async function SiteContent({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const [sp, site] = await Promise.all([searchParams, getSite()])
  const h = site.home, b = site.business, a = site.about
  return (
    <>
      <Head title="Site content" sub="The words and photos on the home page, plus the business details shown in the footer, policies and itineraries.">
        <a href="/" target="_blank" rel="noopener" className="btn b-ghost"><Icon name="external" size={16} />View home page</a>
      </Head>
      <Flash ok={sp.ok} err={sp.err} />
      <nav className="ad-jump" aria-label="Sections"><a href="#hero">Top of home page</a><a href="#photos">Photo wall</a><a href="#faq">FAQ</a><a href="#about">About us page</a><a href="#business">Business details</a></nav>

      <form action={saveSite}>
        <section className="card pane" id="hero">
          <h2 className="ad-h2">Top of the home page</h2>
          <p className="ad-sub">Leave a box empty to use the original wording.</p>
          <div className="fld"><label className="l" htmlFor="s-top">Thin bar above the menu</label><input id="s-top" className="inp" name="topbar" defaultValue={h.topbar} maxLength={160} placeholder={DEFAULT_HOME.topbar} /></div>
          <div className="g2">
            <div className="fld"><label className="l" htmlFor="s-k">Small line above the headline</label><input id="s-k" className="inp" name="kicker" defaultValue={h.kicker} maxLength={80} placeholder={DEFAULT_HOME.kicker} /></div>
            <div className="fld"><label className="l" htmlFor="s-h">Headline</label><textarea id="s-h" className="inp" name="headline" defaultValue={h.headline} maxLength={120} style={{ minHeight: 70 }} placeholder={DEFAULT_HOME.headline} /><p className="hint">Press Enter where the line should break. Put words between *stars* to show them in the lavender italic, like <b>Mountains *are calling.*</b></p></div>
          </div>
          <div className="fld"><label className="l" htmlFor="s-in">Sentence under the headline</label><textarea id="s-in" className="inp" name="intro" defaultValue={h.intro} maxLength={300} style={{ minHeight: 70 }} placeholder={DEFAULT_HOME.intro} /></div>
          <div className="fld"><label className="l" htmlFor="s-sub">Line under the group trips heading</label><input id="s-sub" className="inp" name="subline" defaultValue={h.subline} maxLength={240} placeholder={DEFAULT_HOME.subline} /></div>
        </section>

        <section className="card pane" id="photos">
          <h2 className="ad-h2">Photo wall</h2>
          <p className="ad-sub">The &quot;From our last trip&quot; section. Add photos from each trip you run; tick &quot;Show wide&quot; for group shots. The first photo is the biggest.</p>
          <div className="g2">
            <div className="fld"><label className="l" htmlFor="s-pt">Section title</label><input id="s-pt" className="inp" name="photosTitle" defaultValue={h.photosTitle} maxLength={80} /></div>
            <div className="fld"><label className="l" htmlFor="s-px">Line under the title</label><input id="s-px" className="inp" name="photosText" defaultValue={h.photosText} maxLength={200} /></div>
          </div>
          <GalleryEditor name="photos_json" wideOption initial={h.photos.map((p) => ({ src: p.src, caption: p.caption, wide: p.wide }))} />
        </section>

        <section className="card pane" id="faq">
          <h2 className="ad-h2">Questions people ask</h2>
          <p className="ad-sub">Shown at the bottom of the home page and given to Google, so answers can appear in search.</p>
          <RowsEditor name="faqs_json" addLabel="Add a question" itemLabel="Question" initial={h.faqs.map((f) => ({ q: f.q, a: f.a }))}
            fields={[{ key: 'q', label: 'Question' }, { key: 'a', label: 'Answer', type: 'textarea' }]} />
        </section>

        <section className="card pane" id="about">
          <h2 className="ad-h2">About us page</h2>
          <p className="ad-sub">The <a href="/about" target="_blank" rel="noopener" style={{ color: 'var(--ink3)' }}>About us</a> page: the founder, the story of Lavigo and what customers can count on.</p>
          <div className="g2">
            <div className="fld"><label className="l" htmlFor="a-t">Page headline</label><input id="a-t" className="inp" name="about_title" defaultValue={a.title} maxLength={120} placeholder={DEFAULT_ABOUT.title} /><p className="hint">*Stars* make the lavender italic.</p></div>
            <div className="fld"><label className="l" htmlFor="a-i">Introduction</label><textarea id="a-i" className="inp" name="about_intro" defaultValue={a.intro} maxLength={400} style={{ minHeight: 70 }} /></div>
          </div>
          <div className="g3">
            <div className="fld"><label className="l" htmlFor="a-fn">Founder&apos;s name</label><input id="a-fn" className="inp" name="founder_name" defaultValue={a.founderName} maxLength={80} /></div>
            <div className="fld" style={{ gridColumn: 'span 2' }}><label className="l" htmlFor="a-fr">Role</label><input id="a-fr" className="inp" name="founder_role" defaultValue={a.founderRole} maxLength={120} /></div>
          </div>
          <label className="l">Founder&apos;s photo</label>
          <ImageField name="founder_photo" value={a.founderPhoto} />
          <p className="hint">A portrait works best (taller than wide). Until you add one, the page shows his initials.</p>
          <div className="fld" style={{ marginTop: 14 }}><label className="l" htmlFor="a-fb">About the founder</label><textarea id="a-fb" className="inp" name="founder_bio" defaultValue={a.founderBio} maxLength={2000} style={{ minHeight: 110 }} placeholder="Where he is from, why he started Lavigo, the trips he loves to lead." /></div>
          <div className="fld"><label className="l" htmlFor="a-st">The story of Lavigo</label><textarea id="a-st" className="inp" name="about_story" defaultValue={a.story} maxLength={6000} style={{ minHeight: 200 }} /><p className="hint">Leave an empty line between paragraphs.</p></div>
          <label className="l">What customers can count on</label>
          <RowsEditor name="values_json" addLabel="Add a point" itemLabel="Point" initial={a.values.map((v) => ({ title: v.title, text: v.text }))}
            fields={[{ key: 'title', label: 'Title', placeholder: 'A trip leader with you' }, { key: 'text', label: 'One line', type: 'textarea' }]} />
          <label className="l" style={{ marginTop: 18 }}>Photos on the About page</label>
          <p className="hint" style={{ marginTop: 0 }}>Up to 5 are shown. With none, photos from the last trip are used.</p>
          <GalleryEditor name="about_photos_json" initial={a.photos.map((p) => ({ src: p.src, caption: p.caption }))} />
        </section>

        <section className="card pane" id="business">
          <h2 className="ad-h2">Business details</h2>
          <p className="ad-sub">Used in the footer, the privacy and terms pages, and printed itineraries.</p>
          <div className="g2">
            <div className="fld"><label className="l" htmlFor="s-em">Email for customers</label><input id="s-em" className="inp" name="email" type="email" defaultValue={b.email} placeholder="hello@lavigo.in" /></div>
            <div className="fld"><label className="l" htmlFor="s-gst">GSTIN</label><input id="s-gst" className="inp" name="gstin" defaultValue={b.gstin} maxLength={15} placeholder="20ABCDE1234F1Z5" style={{ textTransform: 'uppercase' }} /></div>
          </div>
          <div className="g2">
            <div className="fld"><label className="l" htmlFor="s-ad">Office address</label><textarea id="s-ad" className="inp" name="address" defaultValue={b.address} maxLength={240} style={{ minHeight: 70 }} placeholder={DEFAULT_BUSINESS.address} /></div>
            <div className="fld"><label className="l" htmlFor="s-ig">Instagram link</label><input id="s-ig" className="inp" name="instagram" defaultValue={b.instagram} placeholder="https://www.instagram.com/lavigo.in/" /></div>
          </div>
          <p className="hint">Phone and WhatsApp number: {BUSINESS.phoneDisplay}. This is built into every booking button, so ask your developer to change it.</p>
        </section>

        <div className="ad-savebar"><span>The home page updates within a minute of saving.</span><button className="btn b-main lg">Save site content</button></div>
      </form>
    </>
  )
}
