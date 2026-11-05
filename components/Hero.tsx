'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BUSINESS } from '@/lib/config'
import { waLink } from '@/lib/whatsapp'

type Slide = { title: string; eyebrow: string; sub: string; img: string; fg?: string; thumb: string; pos: string; top: string; subTop: string; fs?: number; dest: string }
const SLIDES: Slide[] = [
  { title: 'NEPAL', eyebrow: 'Kathmandu valley', sub: 'Swayambhunath, Kathmandu', img: 'nepal', fg: 'nepal', thumb: 'nepal', pos: '50% 35%', top: '13%', subTop: '56%', dest: 'nepal' },
  { title: 'SIKKIM', eyebrow: 'East Sikkim · 12,300 ft', sub: 'Tsomgo Lake', img: 'sikkim', fg: 'sikkim', thumb: 'sikkim', pos: '50% 45%', top: '19%', subTop: '52%', dest: 'sikkim' },
  { title: 'DARJEELING', eyebrow: 'Queen of the hills', sub: 'The town at dusk', img: 'darjeeling', thumb: 'darjeeling', pos: '50% 40%', top: '22%', subTop: '48%', fs: 0.62, dest: 'darjeeling' },
  { title: 'GOA', eyebrow: 'North Goa', sub: 'Cliffs, coves and sunsets', img: 'goa', thumb: 'goa', pos: '50% 30%', top: '8%', subTop: '40%', dest: 'goa' },
]

type Props = {
  destinations: { slug: string; name: string }[]
  tripSlugByDest: Record<string, string>
  defaultDate: string
}

export function Hero({ destinations, tripSlugByDest, defaultDate }: Props) {
  const router = useRouter()
  const [i, setI] = useState(0)
  const [drawer, setDrawer] = useState(false)
  const [tab, setTab] = useState<'group' | 'custom' | 'weekend'>('group')
  const [dest, setDest] = useState('nepal')
  const [date, setDate] = useState(defaultDate)
  const [pax, setPax] = useState(2)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const t = setTimeout(() => setI((x) => (x + 1) % SLIDES.length), 7000)
    return () => clearTimeout(t)
  }, [i])

  const pickTab = (t: typeof tab) => {
    setTab(t)
    if (t === 'weekend') setDest('netarhat')
    else if (t === 'group') setDest('nepal')
  }
  const go = () => {
    const slug = tripSlugByDest[dest]
    if (tab === 'group' && slug) router.push(`/trips/${slug}`)
    else router.push(`/plan?dest=${dest}&date=${date}&pax=${pax}`)
  }

  return (
    <>
      <div className="ph" id="ph">
        {SLIDES.map((s, n) => (
          <div key={s.title} className={'ph-slide' + (n === i ? ' on' : '')} aria-hidden={n !== i}>
            <div className="ph-zoom">
              <Image className="bg" src={`/img/hero-${s.img}-bg.webp`} alt={s.sub} fill priority={n === 0} sizes="100vw" style={{ objectFit: 'cover', objectPosition: s.pos }} />
              {s.fg && <Image className="fg" src={`/img/hero-${s.fg}-fg.webp`} alt="" fill priority={n === 0} sizes="100vw" style={{ objectFit: 'cover', objectPosition: s.pos }} />}
              <div className="ph-title" style={{ top: s.top, ...(s.fs ? { fontSize: `calc(clamp(84px,17vw,270px)*${s.fs})` } : {}) }}>{s.title}</div>
            </div>
            <div className="ph-shade" />
            <div className="ph-eyebrow" style={{ top: `calc(${s.top} - 30px)` }}>{s.eyebrow}</div>
            <div className="ph-sub" style={{ top: s.subTop }}><b>{s.sub}</b><i>✦ ✦ ✦</i></div>
          </div>
        ))}

        <div className="ph-top">
          <button className="ph-menu" onClick={() => setDrawer(true)} aria-label="Open menu"><i /><span>Menu</span></button>
          <div className="ph-notch"><Link href="/" aria-label="Lavigo Travel Co. home"><Image src="/img/logo.webp" alt="Lavigo Travel Co." width={288} height={105} priority style={{ height: 26, width: 'auto' }} /></Link></div>
          <div className="ph-icons">
            <a href={waLink()} target="_blank" rel="noopener" title="WhatsApp" aria-label="WhatsApp"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4.1-4.9-4.3-.1-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .6l-.4.6-.4.5c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.4z" /></svg></a>
            <Link href="/my-bookings" title="My bookings" aria-label="My bookings"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-4 4-6 8-6s7 2 8 6" /></svg></Link>
          </div>
        </div>

        <div className="ph-thumbs">
          {SLIDES.map((s, n) => (
            <button key={s.title} className={n === i ? 'on' : ''} onClick={() => setI(n)} aria-label={`Show ${s.sub}`}><Image src={`/img/thumb-${s.thumb}.webp`} alt="" width={52} height={52} /></button>
          ))}
        </div>
        <div className="ph-social">
          <a href={BUSINESS.instagram} target="_blank" rel="noopener">Instagram</a>
          <a href={waLink()} target="_blank" rel="noopener">WhatsApp</a>
          <a href={`tel:${BUSINESS.phoneE164}`}>Call us</a>
        </div>
        <Link className="ph-badge" href="/plan" aria-label="Plan my trip">
          <svg viewBox="0 0 100 100"><defs><path id="cp" d="M50,50 m-40,0 a40,40 0 1,1 80,0 a40,40 0 1,1 -80,0" /></defs><text fill="#fff" fontSize="8.4" letterSpacing="2.2"><textPath href="#cp">PLANNED DAY BY DAY · PLANNED DAY BY DAY ·</textPath></text></svg>
          <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
        </Link>
        <div className="ph-find"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.2L18 4l-2.2 4.9L21 10l-5.2 1.6L19 16l-4.9-2.2L13 19l-1-5.2L7 17l2.2-4.9L4 11l5.2-1L6 5l4.8 2.2z" /></svg><span>Find your<br />journey</span></div>

        <div className="ph-search">
          <div className="ph-tabs"><div role="tablist">
            {([['group', 'Group trips'], ['custom', 'Custom trip'], ['weekend', 'Weekend']] as const).map(([k, l]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => pickTab(k)}>{l}</button>
            ))}
          </div></div>
          <div className="ph-bar">
            <div className="ph-f"><div style={{ flex: 1 }}><label htmlFor="s-dest">Where to</label>
              <select id="s-dest" value={dest} onChange={(e) => setDest(e.target.value)}>{destinations.map((d) => <option key={d.slug} value={d.slug}>{d.name}</option>)}</select></div></div>
            <div className="ph-f"><div style={{ flex: 1 }}><label htmlFor="s-date">When</label>
              <input id="s-date" type="date" value={date} min={defaultDate} onChange={(e) => setDate(e.target.value)} /></div></div>
            <div className="ph-f"><div style={{ flex: 1 }}><label htmlFor="s-pax">Travellers</label>
              <select id="s-pax" value={pax} onChange={(e) => setPax(+e.target.value)}>{[1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={n}>{n} traveller{n > 1 ? 's' : ''}</option>)}</select></div></div>
            <button className="ph-go" onClick={go} aria-label="Search trips"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg></button>
          </div>
        </div>
      </div>

      <div className={'ph-drawer' + (drawer ? ' open' : '')} onClick={(e) => { if (e.target === e.currentTarget) setDrawer(false) }}>
        <nav aria-label="Menu">
          <Link href="/" onClick={() => setDrawer(false)}>Home</Link>
          <Link href="/trips" onClick={() => setDrawer(false)}>Group trips</Link>
          <Link href="/plan" onClick={() => setDrawer(false)}>Plan my trip</Link>
          <Link href="/my-bookings" onClick={() => setDrawer(false)}>My bookings</Link>
          <small>{BUSINESS.phoneDisplay} · {BUSINESS.city}</small>
        </nav>
      </div>
    </>
  )
}
