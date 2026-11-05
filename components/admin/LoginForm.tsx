'use client'
import { useActionState } from 'react'
import { signIn } from '@/app/admin/actions'

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {} as { error?: string })
  return (
    <form action={action} className="card pane">
      <div className="fld"><label htmlFor="em">Email</label><input id="em" name="email" type="email" className="inp" autoComplete="username" required /></div>
      <div className="fld"><label htmlFor="pw">Password</label><input id="pw" name="password" type="password" className="inp" autoComplete="current-password" required /></div>
      {state.error && <div className="errbox" role="alert">{state.error}</div>}
      <button className="btn b-main b-block" disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
    </form>
  )
}
