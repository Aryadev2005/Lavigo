import type { Metadata } from 'next'
import Link from 'next/link'
import { signOut } from '../actions'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } }

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <>
      <div className="adm-bar"><div className="wrap">
        <b>Lavigo admin</b>
        <Link href="/admin">Bookings</Link>
        <Link href="/admin/trips">Trips &amp; dates</Link>
        <Link href="/admin/destinations">Planner rates</Link>
        <Link href="/" target="_blank">View site ↗</Link>
        <form action={signOut} style={{ marginLeft: 'auto' }}><button className="btn b-ghost sm">Sign out</button></form>
      </div></div>
      <div className="wrap adm">{children}</div>
    </>
  )
}
