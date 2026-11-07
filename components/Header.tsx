'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BUSINESS } from '@/lib/config'
import { waLink } from '@/lib/whatsapp'

const S = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, 'aria-hidden': true } as const

const tabs = [
  { href: '/trips', label: 'Group Trips', match: (p: string) => p.startsWith('/trips'), icon: <svg {...S}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.4" /><path d="M3 19c.8-3.2 3.2-5 6-5s5.2 1.8 6 5M15 14.3c2.6-.4 5 .9 6 4.7" /></svg> },
  { href: '/plan', label: 'Custom Trip', match: (p: string) => p.startsWith('/plan'), icon: <svg {...S}><path d="M4 6l5-2 6 2 5-2v14l-5 2-6-2-5 2z" /><path d="M9 4v14M15 6v14" /></svg> },
  { href: '/trips?d=weekend', label: 'Weekend', match: () => false, icon: <svg {...S}><path d="M3 19l6-9 4 5 3-4 5 8z" /><circle cx="17" cy="6" r="2" /></svg> },
  { href: '/#destinations', label: 'Destinations', match: () => false, icon: <svg {...S}><path d="M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg> },
  { href: '/#moments', label: 'Trip Vlogs', match: () => false, icon: <svg {...S}><rect x="3" y="5" width="13" height="14" rx="2" /><path d="M16 10l5-3v10l-5-3" /></svg> },
  { href: '/#about', label: 'About Us', match: () => false, icon: <svg {...S}><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg> },
]

export function Header() {
  const path = usePathname()
  if (path.startsWith('/admin')) return null
  return (
    <>
      <div className="m-util">
        <div className="m-wrap">
          <span>Group trips from Ranchi · Nepal · Darjeeling · Sikkim · Netarhat</span>
          <span className="m-util-r">
            <a href={`tel:${BUSINESS.phoneE164}`}>{BUSINESS.phoneDisplay}</a>
            <a href={BUSINESS.instagram} target="_blank" rel="noopener">@lavigo.in</a>
          </span>
        </div>
      </div>
      <header className="m-head">
        <div className="m-wrap">
          <Link href="/" className="m-logo" aria-label="Lavigo Travel Co. home">
            <Image src="/img/logo.webp" alt="Lavigo Travel Co." width={288} height={105} priority style={{ height: 26, width: 'auto' }} />
          </Link>
          <nav className="m-tabs" aria-label="Main">
            {tabs.map((t) => (
              <Link key={t.label} href={t.href} className={t.match(path) ? 'on' : undefined} aria-current={t.match(path) ? 'page' : undefined}>
                {t.icon}{t.label}
              </Link>
            ))}
          </nav>
          <div className="m-acts">
            <Link href="/my-bookings" className="m-btn-line">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>
              <span>My Bookings</span>
            </Link>
            <a href={waLink()} target="_blank" rel="noopener" className="m-btn-ink" aria-label="WhatsApp us">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 20l1.3-3.9A8 8 0 1112 20a8 8 0 01-3.9-1z" /></svg>
              <span>WhatsApp us</span>
            </a>
          </div>
        </div>
      </header>
    </>
  )
}
