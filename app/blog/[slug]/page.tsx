import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icon } from '@/components/Icons'
import { JsonLd } from '@/components/JsonLd'
import { StoryMedia } from '@/components/StoryMedia'
import { BUSINESS, SITE_URL } from '@/lib/config'
import { blocks, getPost, getPosts, readMinutes } from '@/lib/content'
import { fmtDate } from '@/lib/format'
import { absUrl, pageMeta, snippet } from '@/lib/seo'
import { dbConfigured, publicClient } from '@/lib/supabase'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = await getPost(slug)
  if (!p) return { title: 'Story not found' }
  return pageMeta({
    title: p.title, description: snippet(p.excerpt || p.body), path: `/blog/${p.slug}`, image: p.cover, type: 'article',
    publishedTime: p.published_at ?? p.created_at,
  })
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p = await getPost(slug)
  if (!p) notFound()
  const more = (await getPosts()).filter((x) => x.id !== p.id).slice(0, 3)
  let trip: { slug: string; title: string } | null = null
  if (p.trip_id && dbConfigured) {
    const { data } = await publicClient().from('trips').select('slug,title').eq('id', p.trip_id).eq('published', true).maybeSingle()
    trip = data
  }
  const body = blocks(p.body)
  // media goes in the flow of the story: spread evenly between paragraphs
  const step = body.length ? Math.max(1, Math.ceil(body.length / Math.max(1, p.media.length))) : 1
  const chunks: { text: typeof body; media: typeof p.media }[] = []
  let mi = 0
  for (let i = 0; i < Math.max(body.length, 1); i += step) {
    chunks.push({ text: body.slice(i, i + step), media: p.media.slice(mi, mi + 1) })
    mi++
  }
  if (mi < p.media.length) chunks.push({ text: [], media: p.media.slice(mi) })

  return (
    <article className="bp">
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title, description: p.excerpt,
        image: p.cover ? [absUrl(p.cover)] : undefined, inLanguage: 'en-IN',
        datePublished: p.published_at ?? p.created_at.slice(0, 10), mainEntityOfPage: `${SITE_URL}/blog/${p.slug}`,
        author: { '@type': 'Organization', name: BUSINESS.name, url: SITE_URL }, publisher: { '@id': `${SITE_URL}/#agency` },
      }} />
      <JsonLd data={{
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: 'Travel stories', item: `${SITE_URL}/blog` },
          { '@type': 'ListItem', position: 3, name: p.title, item: `${SITE_URL}/blog/${p.slug}` },
        ],
      }} />
      <header className="bp-hero">
        {p.cover && <Image src={p.cover} alt="" fill priority sizes="100vw" style={{ objectFit: 'cover' }} />}
        <span className="bp-shade" />
        <div className="m-wrap bp-hero-in">
          <Link href="/blog" className="bp-back"><Icon name="arrow" size={14} /> Travel stories</Link>
          <p className="bl-meta">{p.place && <span>{p.place}</span>}{p.published_at && <span>{fmtDate(p.published_at, { day: 'numeric', month: 'long', year: 'numeric' })}</span>}<span>{readMinutes(p)} min read</span></p>
          <h1>{p.title}</h1>
          {p.excerpt && <p className="bp-ex">{p.excerpt}</p>}
        </div>
      </header>
      <div className="bp-body">
        {chunks.map((c, i) => (
          <div key={i}>
            {c.text.map((b, j) => b.kind === 'h' ? <h2 key={j}>{b.text}</h2> : b.kind === 'q' ? <blockquote key={j}>{b.text}</blockquote> : <p key={j}>{b.text}</p>)}
            {c.media.map((m, j) => <StoryMedia key={j} m={m} />)}
          </div>
        ))}
        <div className="bp-cta">
          <div><b>{trip ? `Join the next ${trip.title}` : 'Want to go?'}</b><span>Group departures every month, or a private trip on your own dates.</span></div>
          <Link href={trip ? `/trips/${trip.slug}` : '/trips'} className="lv-pill">{trip ? 'Book now' : 'See trips'} <span aria-hidden="true"><Icon name="arrow" size={16} /></span></Link>
        </div>
      </div>
      {more.length > 0 && (
        <section className="m-sec"><div className="m-wrap">
          <div className="m-sec-h"><div><h2>More stories</h2></div><Link href="/blog" className="m-more">All stories <Icon name="arrow" size={18} /></Link></div>
          <div className="bl-grid">
            {more.map((x) => (
              <Link key={x.id} href={`/blog/${x.slug}`} className="bl-card">
                <div className="bl-card-pic">{x.cover && <Image src={x.cover} alt="" fill sizes="(max-width:700px) 100vw, 33vw" style={{ objectFit: 'cover' }} />}</div>
                <p className="bl-meta">{x.place && <span>{x.place}</span>}<span>{readMinutes(x)} min read</span></p>
                <h3>{x.title}</h3>
              </Link>
            ))}
          </div>
        </div></section>
      )}
    </article>
  )
}
