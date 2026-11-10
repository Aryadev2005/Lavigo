import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/admin/LoginForm'
import { authConfigured, getAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Owner login', robots: { index: false, follow: false } }

export default async function Login() {
  if (await getAdmin()) redirect('/admin')
  return (
    <div className="ad ad-login">
      <div className="ad-login-art">
        <Image src="/img/logo-white.webp" alt="Lavigo Travel Co." width={288} height={105} style={{ height: 34, width: 'auto' }} priority />
        <div>
          <h2>Every trip, seat and rupee in one place.</h2>
          <p>Bookings, payments, departures, trips, photos and the website, managed by you.</p>
        </div>
        <svg className="mtn" viewBox="0 0 800 220" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 220V150l90-60 70 40 110-100 90 80 70-45 120 95 80-55 90 60 80-35v90z" fill="#2F2463" />
          <path d="M0 220v-40l120-50 100 45 130-70 110 70 120-40 120 55 100-30v60z" fill="#160F30" />
        </svg>
      </div>
      <div className="ad-login-f">
        <div className="card">
          <h1>Owner login</h1>
          <p className="muted" style={{ margin: '0 0 20px' }}>Sign in to manage Lavigo.</p>
          {authConfigured ? <LoginForm /> : <div className="ad-flash err">The database is not connected yet. Add the Supabase keys (see README), then reload.</div>}
        </div>
      </div>
    </div>
  )
}
