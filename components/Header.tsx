'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { BUSINESS } from '@/lib/config'
import { waLink } from '@/lib/whatsapp'
import { Icon, WhatsAppGlyph, type IconName } from './Icons'
import { useMe } from './useMe'

const tabs: { href: string; label: string; icon: IconName; match: (p: string, q: string) => boolean }[] = [
  { href: '/', label: 'Home', icon: 'grid', match: (p) => p === '/' },
  { href: '/trips', label: 'Group Trips', icon: 'group', match: (p, q) => p.startsWith('/trips') && !q.includes('weekend') },
  { href: '/trips?d=weekend', label: 'Weekend', icon: 'weekend', match: (p, q) => p.startsWith('/trips') && q.includes('weekend') },
  { href: '/plan', label: 'Custom Trip', icon: 'route', match: (p) => p.startsWith('/plan') },
  { href: '/blog', label: 'Travel Stories', icon: 'vlog', match: (p) => p.startsWith('/blog') },
  { href: '/reviews', label: 'Reviews', icon: 'star', match: (p) => p.startsWith('/reviews') },
  { href: '/about', label: 'About Us', icon: 'shield', match: (p) => p.startsWith('/about') },
]

export function Header({ topbar, instagram = BUSINESS.instagram }: { topbar?: string; instagram?: string }) {
  const path = usePathname()
  const head = useRef<HTMLElement>(null)
  const [q, setQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const me = useMe()
  const home = path === '/'

  // Publish the live header height so sticky sub-bars, anchor scrolling and the home hero can sit flush beneath it.
  useEffect(() => {
    const el = head.current
    if (!el) return
    const set = () => document.documentElement.style.setProperty('--head-h', el.offsetHeight + 'px')
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [path])
  useEffect(() => { setQ(window.location.search); setOpen(false) }, [path])
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  if (path.startsWith('/admin') || path.endsWith('/itinerary')) return null
  const clear = home && !scrolled && !open // see-through over the home hero until you scroll
  return (
    <>
      <div className="m-util">
        <div className="m-wrap">
          <span className="m-util-l">{topbar ?? 'Trips from anywhere in India · Nepal · Darjeeling · Sikkim · Netarhat · Puri · Goa'}</span>
          <span className="m-util-r">
            <a href={`tel:${BUSINESS.phoneE164}`}>{BUSINESS.phoneDisplay}</a>
            <a href={instagram} target="_blank" rel="noopener">Instagram</a>
          </span>
        </div>
      </div>
      <header className={'m-head lv-head' + (clear ? ' is-clear' : '') + (open ? ' is-open' : '')} ref={head}>
        <div className="m-wrap">
          <Link href="/" className="m-logo" aria-label="Lavigo Travel Co. home">
            <Image src={clear ? '/img/logo-white.webp' : '/img/logo-ink.webp'} alt="Lavigo Travel Co." width={288} height={105} priority style={{ height: 30, width: 'auto' }} />
          </Link>
          <nav className="m-tabs" aria-label="Main" id="main-nav">
            {tabs.map((t) => {
              const on = t.match(path, q)
              return (
                <Link key={t.label} href={t.href} className={on ? 'on' : undefined} aria-current={on ? 'page' : undefined}>
                  <span className="m-tab-ic"><Icon name={t.icon} /></span>{t.label}
                </Link>
              )
            })}
          </nav>
          <div className="m-acts">
            {me.loading ? <span className="lv-acct-skel" aria-hidden="true" />
              : me.user
                ? <Link href="/account" className="lv-acct" title={me.user.email}><span className="lv-avatar" aria-hidden="true">{(me.user.name || me.user.email || '?').slice(0, 1).toUpperCase()}</span><span>My trips</span></Link>
                : <Link href={`/login?next=${encodeURIComponent(path)}`} className="lv-acct"><Icon name="user" size={18} /><span>Sign in</span></Link>}
            <a href={waLink()} target="_blank" rel="noopener" className="lv-cta" aria-label="Plan a trip on WhatsApp">
              <span className="lv-cta-t">Plan a trip</span>
              <span className="lv-cta-i"><WhatsAppGlyph /></span>
            </a>
            <button type="button" className="lv-burger" aria-expanded={open} aria-controls="main-nav" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen((o) => !o)}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>
    </>
  )
}
