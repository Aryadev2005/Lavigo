import type { Metadata } from 'next'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { AuthForms } from '@/components/AuthForms'
import { getCustomer } from '@/lib/customer'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const ERRORS: Record<string, string> = {
  google: 'Google sign-in did not work. Please try again, or use your email.',
  link: 'That link has expired or was already used. Please sign in again.',
  off: 'Accounts are not switched on yet. Please message us on WhatsApp to book.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const raw = sp.next || '/account'
  const next = raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/admin') ? raw : '/account'
  if (await getCustomer()) redirect(next)
  const booking = next.startsWith('/trips/')
  return (
    <div className="au-page">
      <div className="au-wrap">
        <div className="au-side">
          <p className="lv-eyebrow">Your Lavigo account</p>
          <h1 className="au-h">{booking ? <>Sign in to <em>book your seats.</em></> : <>Welcome <em>back.</em></>}</h1>
          <p className="au-sub">One account keeps every booking, itinerary and receipt in one place. Sign in with Google in one tap, or use your email.</p>
          <ul className="au-points">
            <li>See all your trips and payments</li>
            <li>Download itineraries the moment they are ready</li>
            <li>Review your trip and help other travellers</li>
          </ul>
          <AuthForms next={next} initial={sp.mode === 'up' ? 'up' : 'in'} error={sp.e ? ERRORS[sp.e] : undefined} />
        </div>
        <div className="au-art" aria-hidden="true">
          <Image src="/img/sikkim-1.webp" alt="" fill sizes="(max-width:900px) 0px, 45vw" style={{ objectFit: 'cover' }} priority />
          <span className="au-art-cap">Gurudongmar Lake, North Sikkim</span>
        </div>
      </div>
    </div>
  )
}
