'use client'
import { useActionState } from 'react'
import { signIn } from '@/app/admin/actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {} as { error?: string })
  return (
    <form action={action}>
      <div className="fld"><label className="l" htmlFor="em">Email</label><input id="em" name="email" type="email" className="inp" autoComplete="username" required autoFocus /></div>
      <div className="fld"><label className="l" htmlFor="pw">Password</label><input id="pw" name="password" type="password" className="inp" autoComplete="current-password" required /></div>
      {state.error && <div className="ad-flash err" role="alert">{state.error}</div>}
      <button className="btn b-main b-block lg" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
      <p className="hint" style={{ marginTop: 14 }}>Forgot the password? Reset it in Supabase → Authentication → Users.</p>
    </form>
  )
}
