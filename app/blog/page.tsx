import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Icon } from '@/components/Icons'
import { getPosts, readMinutes } from '@/lib/content'
import { fmtDate } from '@/lib/format'

export const revalidate = 60
export const metadata: Metadata = {
  title: 'Travel stories',
  description: 'Stories, photos and videos from Lavigo trips to Nepal, Sikkim, Darjeeling and beyond.',
  alternates: { canonical: '/blog' },
}

export default async function Blog() {
  const posts = await getPosts()
  const [lead, ...rest] = posts
  return (
    <div className="pg">
      <header className="pg-hero">
        <div className="m-wrap">
          <p className="lv-eyebrow">Travel stories</p>
          <h1 className="pg-h">Notes from <em>the road.</em></h1>
          <p className="pg-sub">Photos, videos and the small moments from every Lavigo trip, with a few words on each.</p>
        </div>
      </header>
      <section className="m-sec">
        <div className="m-wrap">
          {!lead && <div className="rv-empty"><Icon name="vlog" size={28} /><p>The first stories are being written. Meanwhile, see <Link href="/#moments">trip moments</Link> from our last Nepal trip.</p></div>}
          {lead && (
            <Link href={`/blog/${lead.slug}`} className="bl-lead">
              <div className="bl-lead-pic">{lead.cover && <Image src={lead.cover} alt="" fill sizes="(max-width:900px) 100vw, 60vw" style={{ objectFit: 'cover' }} priority />}</div>
              <div className="bl-lead-t">
                <p className="bl-meta">{lead.place && <span>{lead.place}</span>}{lead.published_at && <span>{fmtDate(lead.published_at, { day: 'numeric', month: 'long', year: 'numeric' })}</span>}<span>{readMinutes(lead)} min read</span></p>
                <h2>{lead.title}</h2>
                <p>{lead.excerpt}</p>
                <span className="bl-more">Read the story <Icon name="arrow" size={16} /></span>
              </div>
            </Link>
          )}
          {rest.length > 0 && (
            <div className="bl-grid">
              {rest.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="bl-card">
                  <div className="bl-card-pic">
                    {p.cover && <Image src={p.cover} alt="" fill sizes="(max-width:700px) 100vw, 33vw" style={{ objectFit: 'cover' }} />}
                    {p.media.some((m) => m.type === 'video') && <span className="bl-badge"><Icon name="play" size={12} /> Video</span>}
                  </div>
                  <p className="bl-meta">{p.place && <span>{p.place}</span>}<span>{readMinutes(p)} min read</span></p>
                  <h3>{p.title}</h3>
                  <p className="bl-ex">{p.excerpt}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
