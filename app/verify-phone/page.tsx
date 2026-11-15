import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { VerifyPhoneForm } from '@/components/AccountForms'
import { AuthShell } from '@/components/AuthShell'
import { getCustomer } from '@/lib/customer'

export const metadata: Metadata = { title: 'Verify your WhatsApp number', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function VerifyPhonePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams
  const raw = sp.next || '/account'
  const next = raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/admin') && !raw.startsWith('/verify-phone') ? raw : '/account'
  const me = await getCustomer()
  if (!me) redirect(`/login?next=${encodeURIComponent(`/verify-phone?next=${encodeURIComponent(next)}`)}`)
  if (me.phoneVerified && !sp.change) redirect(next)
  return (
    <AuthShell>
      <h1 className="au-h">{sp.change ? 'Change your' : 'One last'} <em>{sp.change ? 'number.' : 'step.'}</em></h1>
      <p className="au-sub">Verify your WhatsApp number. Booking confirmations and trip updates come here.</p>
      <VerifyPhoneForm next={next} phone={me.phoneVerified ? '' : me.phone} />
    </AuthShell>
  )
}
