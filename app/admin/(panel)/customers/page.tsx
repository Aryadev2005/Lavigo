import Link from 'next/link'
import { Head, money, rel, waTo } from '@/components/admin/ui'
import { listCustomers } from '@/lib/admin-extra'

export const metadata = { title: 'Customers' }

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams
  const all = await listCustomers()
  const q = (sp.q ?? '').trim().toLowerCase()
  const list = all?.filter((c) => !q || [c.full_name, c.email, c.phone].some((v) => (v ?? '').toLowerCase().includes(q))) ?? null
  return (
    <>
      <Head title="Customers" sub={all ? `${all.length} customer account${all.length === 1 ? '' : 's'}. People sign up with Google or their email before they book.` : undefined} />
      {list === null ? <div className="card ad-empty"><b>Needs the database update</b>Run 008_accounts_reviews_blog.sql in Supabase to switch on customer accounts.</div> : (
        <>
          <form method="get" style={{ display: 'flex', gap: 8, marginBottom: 14, maxWidth: 480 }}><input className="inp" name="q" defaultValue={sp.q} placeholder="Search name, email or phone" aria-label="Search customers" /><button className="btn b-ghost">Search</button></form>
          <div className="card ad-scroll">
            {list.length === 0 ? <div className="ad-empty"><b>No customers {q ? 'match' : 'yet'}</b>{q ? 'Try another search.' : 'Accounts appear here as soon as someone signs up.'}</div> : (
              <table className="ad-tbl">
                <thead><tr><th>Customer</th><th>Phone</th><th className="num">Bookings</th><th className="num">Paid so far</th><th>Last booking</th><th>Joined</th></tr></thead>
                <tbody>
                  {list.map((c) => (
                    <tr key={c.id}>
                      <td><b>{c.full_name || '—'}</b><small>{c.email}</small></td>
                      <td>{c.phone ? <a href={waTo(c.phone)} target="_blank" rel="noopener">{c.phone}</a> : <span className="muted">—</span>}</td>
                      <td className="num">{c.bookings ? <Link href={`/admin/bookings?q=${encodeURIComponent(c.email ?? c.phone)}`}>{c.bookings}</Link> : 0}</td>
                      <td className="num">{money(c.spent)}</td>
                      <td>{c.last ? rel(c.last) : <span className="muted">—</span>}</td>
                      <td>{rel(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </>
  )
}
