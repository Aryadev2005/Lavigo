import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/LoginForm'
import { authConfigured, getAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Owner login', robots: { index: false, follow: false } }

export default async function Login() {
  if (await getAdmin()) redirect('/admin')
  return (
    <section><div className="wrap" style={{ maxWidth: 420 }}>
      <h1 style={{ fontSize: 30, letterSpacing: '-.02em', marginBottom: 6 }}>Owner login</h1>
      <p className="muted" style={{ marginBottom: 18 }}>Lavigo admin: bookings, trips, dates and seats.</p>
      {authConfigured ? <LoginForm /> : <div className="errbox">The database is not connected yet. Add the Supabase keys (see README), then reload.</div>}
    </div></section>
  )
}
