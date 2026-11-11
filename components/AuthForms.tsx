'use client'
import { keepForm } from './keepForm'
import { useActionState, useState } from 'react'
import { googleSignIn, sendPasswordReset, signInCustomer, signUpCustomer, type AuthState } from '@/app/actions/account'

type Mode = 'in' | 'up' | 'reset'

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

function Note({ s }: { s: AuthState }) {
  if (s.error) return <p className="au-msg bad" role="alert">{s.error}</p>
  if (s.info) return <p className="au-msg ok" role="status">{s.info}</p>
  return null
}

export function AuthForms({ next, initial = 'in', error }: { next: string; initial?: Mode; error?: string }) {
  const [mode, setMode] = useState<Mode>(initial)
  const [inState, inAction, inBusy] = useActionState(signInCustomer, {})
  const [upState, upAction, upBusy] = useActionState(signUpCustomer, {})
  const [rsState, rsAction, rsBusy] = useActionState(sendPasswordReset, {})

  return (
    <div className="au-card">
      {mode !== 'reset' && (
        <div className="au-tabs" role="tablist" aria-label="Sign in or create an account">
          <button type="button" role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'on' : ''} onClick={() => setMode('in')}>Sign in</button>
          <button type="button" role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'on' : ''} onClick={() => setMode('up')}>Create account</button>
        </div>
      )}

      {error && <p className="au-msg bad" role="alert">{error}</p>}

      {mode !== 'reset' && (
        <>
          <form action={googleSignIn}>
            <input type="hidden" name="next" value={next} />
            <button className="au-google" type="submit"><GoogleMark /> Continue with Google</button>
          </form>
          <div className="au-or"><span>or with your email</span></div>
        </>
      )}

      {mode === 'in' && (
        <form onSubmit={keepForm(inAction)} className="au-form">
          <input type="hidden" name="next" value={next} />
          <label className="au-l" htmlFor="au-email">Email</label>
          <input className="au-in" id="au-email" name="email" type="email" autoComplete="email" required />
          <label className="au-l" htmlFor="au-pw">Password</label>
          <input className="au-in" id="au-pw" name="password" type="password" autoComplete="current-password" required />
          <Note s={inState} />
          <button className="au-btn" disabled={inBusy}>{inBusy ? 'Signing in…' : 'Sign in'}</button>
          <button type="button" className="au-link" onClick={() => setMode('reset')}>Forgot your password?</button>
        </form>
      )}

      {mode === 'up' && (
        <form onSubmit={keepForm(upAction)} className="au-form">
          <input type="hidden" name="next" value={next} />
          <label className="au-l" htmlFor="au-name">Full name</label>
          <input className="au-in" id="au-name" name="name" autoComplete="name" required minLength={2} />
          <label className="au-l" htmlFor="au-email2">Email</label>
          <input className="au-in" id="au-email2" name="email" type="email" autoComplete="email" required />
          <label className="au-l" htmlFor="au-pw2">Password <span>at least 8 characters</span></label>
          <input className="au-in" id="au-pw2" name="password" type="password" autoComplete="new-password" required minLength={8} />
          <Note s={upState} />
          <button className="au-btn" disabled={upBusy}>{upBusy ? 'Creating your account…' : 'Create account'}</button>
          <p className="au-fine">By creating an account you agree to our <a href="/terms">terms</a> and <a href="/privacy">privacy policy</a>.</p>
        </form>
      )}

      {mode === 'reset' && (
        <form onSubmit={keepForm(rsAction)} className="au-form">
          <h2 className="au-h2">Reset your password</h2>
          <p className="au-fine">Enter the email you signed up with and we&apos;ll send you a link to set a new password.</p>
          <label className="au-l" htmlFor="au-email3">Email</label>
          <input className="au-in" id="au-email3" name="email" type="email" autoComplete="email" required />
          <Note s={rsState} />
          <button className="au-btn" disabled={rsBusy}>{rsBusy ? 'Sending…' : 'Send reset link'}</button>
          <button type="button" className="au-link" onClick={() => setMode('in')}>Back to sign in</button>
        </form>
      )}
    </div>
  )
}
