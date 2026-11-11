'use client'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export type Me = { id: string; email: string; name: string; phone: string }
type State = { loading: boolean; user: Me | null }

// One request per page, shared by every component that asks on that page (header, booking form,
// enquiry form). A new page (including the redirect after signing in or out) asks again.
let pending: Promise<Me | null> | null = null
let key = ''
export function fetchMe(page: string, force = false): Promise<Me | null> {
  if (!pending || force || page !== key) {
    key = page
    pending = fetch('/api/me', { cache: 'no-store', credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d: { user: Me | null }) => d.user)
      .catch(() => null)
  }
  return pending
}

/** Who is signed in (customer account), read in the browser so pages can stay static and fast. */
export function useMe(): State {
  const path = usePathname()
  const [s, set] = useState<State>({ loading: true, user: null })
  useEffect(() => {
    let live = true
    fetchMe(path).then((user) => live && set({ loading: false, user }))
    return () => { live = false }
  }, [path])
  return s
}
