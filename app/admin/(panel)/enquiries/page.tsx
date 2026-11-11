import { Fragment } from 'react'
import Link from 'next/link'
import { updateEnquiry } from '../../actions'
import { Flash, Head, rel, waTo } from '@/components/admin/ui'
import { Icon } from '@/components/Icons'
import { listEnquiries } from '@/lib/admin-extra'

export const metadata = { title: 'Enquiries' }

const KIND: Record<string, string> = { custom: 'Custom trip', question: 'Question', trip: 'About a trip' }
const LABEL: Record<string, string> = { destination: 'Where to', start_city: 'From', dates: 'When', nights: 'Nights', travellers: 'Travellers', budget: 'Budget', trip: 'Trip' }

export default async function Enquiries({ searchParams }: { searchParams: Promise<{ s?: string; ok?: string; err?: string }> }) {
  const sp = await searchParams
  const tab = sp.s ?? 'new'
  const list = await listEnquiries(tab)
  const here = `/admin/enquiries?s=${tab}`
  return (
    <>
      <Head title="Enquiries" sub="Custom-trip requests and questions from the website. Each one also opened WhatsApp for the customer, so check your chats too." />
      <Flash ok={sp.ok} err={sp.err} />
      <nav className="ad-tabs" aria-label="Filter">
        {[['new', 'New'], ['replied', 'Replied'], ['closed', 'Closed'], ['all', 'All']].map(([k, l]) => <Link key={k} href={`/admin/enquiries?s=${k}`} className={tab === k ? 'on' : undefined}>{l}</Link>)}
      </nav>
      {list === null ? <div className="card ad-empty"><b>Needs the database update</b>Run 008_accounts_reviews_blog.sql in Supabase to start saving enquiries.</div>
        : list.length === 0 ? <div className="card ad-empty"><b>Nothing here</b>{tab === 'new' ? 'No new enquiries. They appear here the moment someone sends one.' : 'No enquiries in this list.'}</div>
        : (
          <div className="ad-cards">
            {list.map((q) => {
              const text = `Hi ${q.name.split(' ')[0]}, this is Lavigo Travel Co. Thank you for your enquiry${q.details.destination ? ` about ${q.details.destination}` : q.trip ? ` about ${q.trip.title}` : ''}. `
              return (
                <article key={q.id} className="card pane ad-enq">
                  <div className="ad-enq-top">
                    <span className={'ad-chip ' + q.kind}>{KIND[q.kind]}</span>
                    <span className="muted">{rel(q.created_at)}</span>
                  </div>
                  <h3>{q.name} <a href={`tel:+91${q.phone}`} className="muted">{q.phone}</a>{q.email ? <span className="muted"> · {q.email}</span> : null}</h3>
                  {q.trip && <p className="muted">Trip: <a href={`/trips/${q.trip.slug}`} target="_blank" rel="noopener">{q.trip.title}</a></p>}
                  {Object.keys(q.details).filter((k) => k !== 'trip').length > 0 && (
                    <dl className="ad-kv ad-enq-kv">{Object.entries(q.details).filter(([k]) => k !== 'trip').map(([k, v]) => <Fragment key={k}><dt>{LABEL[k] ?? k}</dt><dd>{v}</dd></Fragment>)}</dl>
                  )}
                  {q.message && <p className="ad-enq-msg">{q.message}</p>}
                  <form action={updateEnquiry} className="ad-enq-f">
                    <input type="hidden" name="id" value={q.id} /><input type="hidden" name="back" value={here} />
                    <input className="inp sm" name="admin_note" defaultValue={q.admin_note} placeholder="Private note (quote sent, follow up Monday…)" />
                    <select className="inp sm" name="status" defaultValue={q.status} aria-label="Status"><option value="new">New</option><option value="replied">Replied</option><option value="closed">Closed</option></select>
                    <button className="btn b-ghost sm">Save</button>
                    <a className="btn b-wa sm" href={waTo(q.phone, text)} target="_blank" rel="noopener"><Icon name="phone" size={15} />Reply on WhatsApp</a>
                  </form>
                </article>
              )
            })}
          </div>
        )}
    </>
  )
}
