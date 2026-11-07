'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BUSINESS } from '@/lib/config'
import { waLink } from '@/lib/whatsapp'
import { Icon, WhatsAppGlyph, type IconName } from './Icons'

const tabs: { href: string; label: string; icon: IconName; match: (p: string) => boolean }[] = [
  { href: '/trips', label: 'Group Trips', icon: 'group', match: (p) => p.startsWith('/trips') },
  { href: '/plan', label: 'Custom Trip', icon: 'route', match: (p) => p.startsWith('/plan') },
  { href: '/trips?d=weekend', label: 'Weekend', icon: 'weekend', match: () => false },
  { href: '/#destinations', label: 'Destinations', icon: 'globe', match: () => false },
  { href: '/#moments', label: 'Trip Vlogs', icon: 'vlog', match: () => false },
  { href: '/#about', label: 'About Us', icon: 'shield', match: () => false },
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
                <span className="m-tab-ic"><Icon name={t.icon} /></span>{t.label}
              </Link>
            ))}
          </nav>
          <div className="m-acts">
            <Link href="/my-bookings" className="m-btn-line">
              <Icon name="ticket" size={20} />
              <span>My Bookings</span>
            </Link>
            <a href={waLink()} target="_blank" rel="noopener" className="m-btn-ink" aria-label="WhatsApp us">
              <WhatsAppGlyph />
              <span>WhatsApp us</span>
            </a>
          </div>
        </div>
      </header>
    </>
  )
}
