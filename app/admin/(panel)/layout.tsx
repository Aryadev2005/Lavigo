import type { Metadata } from 'next'
import Image from 'next/image'
import { signOut } from '../actions'
import { AdminNav } from '@/components/admin/AdminNav'
import { Icon } from '@/components/Icons'
import { requireAdmin } from '@/lib/admin-auth'
import { adminClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: { default: 'Admin', template: '%s · Lavigo admin' }, robots: { index: false, follow: false } }

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin()
  const { count } = await adminClient().from('bookings').select('id', { count: 'exact', head: true })
    .eq('status', 'held').gt('hold_expires_at', new Date().toISOString())
  return (
    <div className="ad">
      <aside className="ad-side">
        <div className="ad-brand">
          <Image src="/img/logo-white.webp" alt="Lavigo" width={288} height={105} style={{ height: 26, width: 'auto' }} priority />
          <small>ADMIN</small>
        </div>
        <AdminNav holds={count ?? 0} />
        <div className="ad-me">
          <span>Signed in as</span>
          <b title={user.email}>{user.email}</b>
          <form action={signOut}><button type="submit"><Icon name="logout" size={16} />Sign out</button></form>
        </div>
      </aside>
      <div className="ad-main">{children}</div>
    </div>
  )
}
