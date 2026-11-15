import Image from 'next/image'
import Link from 'next/link'
import { waLink } from '@/lib/whatsapp'

const ART = [
  { src: '/img/auth-himalaya.webp', cap: 'Kanchenjunga at blue hour', pos: '50% 42%' },
  { src: '/img/auth-prayer-flags.webp', cap: 'Prayer flags, Sikkim', pos: '50% 45%' },
  { src: '/img/auth-lake.webp', cap: 'Gurudongmar Lake at dawn', pos: '50% 40%' },
]

/** Full-screen, header- and footer-free layout for sign-in and phone verification. A different photo each load. */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const art = ART[Math.floor(Math.random() * ART.length)] // pages using this are force-dynamic, so it changes per request
  return (
    <div className="au-page">
      <div className="au-side">
        <div className="au-top">
          <Link href="/" aria-label="Lavigo Travel Co. home">
            <Image src="/img/logo-ink.webp" alt="Lavigo Travel Co." width={288} height={105} priority style={{ height: 30, width: 'auto' }} />
          </Link>
          <Link href="/" className="au-back">← Back to Lavigo</Link>
        </div>
        <div className="au-main">{children}</div>
        <p className="au-help">Trouble signing in? <a href={waLink('Hi Lavigo, I need help signing in.')} target="_blank" rel="noopener">Message us on WhatsApp</a></p>
      </div>
      <div className="au-art" aria-hidden="true">
        <Image src={art.src} alt="" fill sizes="(max-width:900px) 100vw, 50vw" style={{ objectFit: 'cover', objectPosition: art.pos }} priority />
        <p className="au-art-q">Mountains, <em>together.</em></p>
        <span className="au-art-cap">{art.cap}</span>
      </div>
    </div>
  )
}
