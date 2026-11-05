'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const links = [
  { href: '/', label: 'Home' },
  { href: '/trips', label: 'Group trips' },
  { href: '/my-bookings', label: 'My bookings' },
]

export function Header() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  if (path === '/' || path.startsWith('/admin')) return null // the home hero has its own top bar
  return (
    <header className="top">
      <div className="wrap">
        <Link href="/" aria-label="Lavigo Travel Co. home"><Image src="/img/logo.webp" alt="Lavigo Travel Co." width={288} height={105} priority style={{ height: 32, width: 'auto' }} /></Link>
        <button className="burger" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
        <nav className={'nav' + (open ? ' open' : '')} aria-label="Main">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={path === l.href || (l.href !== '/' && path.startsWith(l.href)) ? 'on' : ''} onClick={() => setOpen(false)}>{l.label}</Link>
          ))}
          <Link href="/plan" className="cta" onClick={() => setOpen(false)}>Plan my trip</Link>
        </nav>
      </div>
    </header>
  )
}
