import Link from 'next/link'
import { Flash, Head, rel } from '@/components/admin/ui'
import { Icon } from '@/components/Icons'
import { listPostsAdmin } from '@/lib/admin-extra'

export const metadata = { title: 'Travel stories' }

export default async function BlogAdmin({ searchParams }: { searchParams: Promise<{ ok?: string; err?: string }> }) {
  const sp = await searchParams
  const posts = await listPostsAdmin()
  return (
    <>
      <Head title="Travel stories" sub="The blog: stories from your trips with photos and videos, each with a description.">
        <Link href="/admin/blog/new" className="btn b-main"><Icon name="plus" size={16} />New story</Link>
        <a href="/blog" target="_blank" rel="noopener" className="btn b-ghost"><Icon name="external" size={16} />View blog</a>
      </Head>
      <Flash ok={sp.ok} err={sp.err} />
      {posts === null ? <div className="card ad-empty"><b>Needs the database update</b>Run 008_accounts_reviews_blog.sql in Supabase to start the blog.</div>
        : posts.length === 0 ? <div className="card ad-empty"><b>No stories yet</b>Write the first one: pick your best photos and videos from a trip and say a few words about each.</div>
        : (
          <div className="ad-postgrid">
            {posts.map((p) => (
              <Link key={p.id} href={`/admin/blog/${p.id}`} className="card ad-post">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className="ad-post-pic">{p.cover ? <img src={p.cover} alt="" /> : <Icon name="image" size={26} />}</div>
                <div className="ad-post-t">
                  <span className={'ad-chip ' + (p.published ? 'approved' : 'pending')}>{p.published ? 'Published' : 'Draft'}</span>
                  <b>{p.title}</b>
                  <small>{p.media.length} photo{p.media.length === 1 ? '' : 's'}/video{p.media.length === 1 ? '' : 's'} · updated {rel(p.created_at)}</small>
                </div>
              </Link>
            ))}
          </div>
        )}
    </>
  )
}
