'use client'
import { keepForm } from './keepForm'
import { useActionState } from 'react'
import { saveMyProfile, setNewPassword } from '@/app/actions/account'

export function ProfileForm({ name, phone }: { name: string; phone: string }) {
  const [s, action, busy] = useActionState(saveMyProfile, {})
  return (
    <form onSubmit={keepForm(action)} className="au-form">
      <label className="au-l" htmlFor="pf-name">Full name</label>
      <input className="au-in" id="pf-name" name="name" defaultValue={name} autoComplete="name" required minLength={2} />
      <label className="au-l" htmlFor="pf-phone">WhatsApp number</label>
      <input className="au-in" id="pf-phone" name="phone" defaultValue={phone} inputMode="numeric" autoComplete="tel-national" placeholder="10-digit mobile number" />
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
