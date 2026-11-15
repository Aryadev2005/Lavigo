'use client'
import Link from 'next/link'
import { keepForm } from './keepForm'
import { useActionState, useEffect, useState } from 'react'
import { saveMyProfile, setNewPassword } from '@/app/actions/account'
import { requestOtp, verifyOtp } from '@/app/actions/phone'

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [s, action, busy] = useActionState(saveMyProfile, {})
  return (
    <form onSubmit={keepForm(action)} className="au-form">
      <label className="au-l" htmlFor="pf-name">Full name</label>
      <input className="au-in" id="pf-name" name="name" defaultValue={name} autoComplete="name" required minLength={2} />
      <p className="au-l">WhatsApp number</p>
      <p>+91 {phone} · <Link className="au-link" href="/verify-phone?change=1&next=/account">Change</Link></p>
      {s.error && <p className="au-msg bad" role="alert">{s.error}</p>}
      {s.info && <p className="au-msg ok" role="status">{s.info}</p>}
      <button className="au-btn" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</button>
    </form>
  )
}

export function PasswordForm() {
  const [s, action, busy] = useActionState(setNewPassword, {})
  return (
    <form onSubmit={keepForm(action)} className="au-form" style={{ maxWidth: 420 }}>
      <label className="au-l" htmlFor="np">New password <span>at least 8 characters</span></label>
      <input className="au-in" id="np" name="password" type="password" autoComplete="new-password" required minLength={8} />
      {s.error && <p className="au-msg bad" role="alert">{s.error}</p>}
      {s.info && <p className="au-msg ok" role="status">{s.info}</p>}
      <button className="au-btn" disabled={busy}>{busy ? 'Saving…' : 'Save new password'}</button>
    </form>
  )
}

export function VerifyPhoneForm({ next, phone }: { next: string; phone: string }) {
  const [sent, sendAction, sending] = useActionState(requestOtp, {})
  const [chk, checkAction, checking] = useActionState(verifyOtp, {})
  const [wait, setWait] = useState(0)
  useEffect(() => { if (sent.info) setWait(60) }, [sent])
  useEffect(() => {
    if (wait <= 0) return
    const t = setTimeout(() => setWait(wait - 1), 1000)
    return () => clearTimeout(t)
  }, [wait])

  return (
    <div className="au-card">
      <form onSubmit={keepForm(sendAction)} className="au-form">
        <label className="au-l" htmlFor="vp-phone">WhatsApp number</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span aria-hidden="true">+91</span>
          <input className="au-in" id="vp-phone" name="phone" defaultValue={phone} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" required pattern="[0-9 ]{10,12}" />
        </div>
        {sent.error && <p className="au-msg bad" role="alert">{sent.error}</p>}
        {sent.info && <p className="au-msg ok" role="status">{sent.info}</p>}
        <button className="au-btn" disabled={sending || wait > 0}>
          {sending ? 'Sending…' : wait > 0 ? `Resend code in ${wait}s` : sent.sent ? 'Resend code' : 'Send code on WhatsApp'}
        </button>
      </form>

      {sent.sent && (
        <form onSubmit={keepForm(checkAction)} className="au-form">
          <input type="hidden" name="next" value={next} />
          <label className="au-l" htmlFor="vp-code">6-digit code</label>
          <input className="au-in" id="vp-code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} pattern="\d{6}" required autoFocus />
          {chk.error && <p className="au-msg bad" role="alert">{chk.error}</p>}
          <button className="au-btn" disabled={checking}>{checking ? 'Checking…' : 'Verify number'}</button>
        </form>
      )}
    </div>
  )
}
