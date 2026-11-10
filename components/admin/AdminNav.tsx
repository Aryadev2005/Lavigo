'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icon, type IconName } from '@/components/Icons'

const ITEMS: { href: string; label: string; icon: IconName; exact?: boolean }[] = [
  { href: '/admin', label: 'Overview', icon: 'grid', exact: true },
  { href: '/admin/bookings', label: 'Bookings', icon: 'ticket' },
  { href: '/admin/departures', label: 'Departures', icon: 'calendar' },
  { href: '/admin/trips', label: 'Trips', icon: 'route' },
  { href: '/admin/destinations', label: 'Destinations', icon: 'globe' },
  { href: '/admin/site', label: 'Site content', icon: 'image' },
]

export function AdminNav({ holds }: { holds: number }) {
  const path = usePathname()
  return (
    <nav className="ad-nav" aria-label="Admin">
      {ITEMS.map((it) => {
        const on = it.exact ? path === it.href : path === it.href || path.startsWith(it.href + '/')
        return (
          <Link key={it.href} href={it.href} className={on ? 'on' : undefined} aria-current={on ? 'page' : undefined}>
            <Icon name={it.icon} size={19} /><span className="t">{it.label}</span>
            {it.href === '/admin/bookings' && holds > 0 && <span className="cnt" title={`${holds} on hold, waiting for payment`}>{holds}</span>}
          </Link>
        )
      })}
      <hr />
      <Link href="/admin/bookings/new"><Icon name="plus" size={19} /><span className="t">New booking</span></Link>
      <a href="/" target="_blank" rel="noopener"><Icon name="external" size={19} /><span className="t">View website</span></a>
    </nav>
  )
}
