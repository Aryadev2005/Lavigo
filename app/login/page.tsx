import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthForms } from '@/components/AuthForms'
import { AuthShell } from '@/components/AuthShell'
import { getCustomer, verifyPhoneUrl } from '@/lib/customer'

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
  const me = await getCustomer()
  if (me) redirect(me.phoneVerified ? next : verifyPhoneUrl(next))
  return (
    <AuthShell>
      <AuthForms next={next} initial={sp.mode === 'up' ? 'up' : 'in'} error={sp.e ? ERRORS[sp.e] : undefined} />
    </AuthShell>
  )
}
