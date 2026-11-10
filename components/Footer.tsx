import Image from 'next/image'
import Link from 'next/link'
import { BUSINESS } from '@/lib/config'
import { getSite } from '@/lib/site'
import { waLink } from '@/lib/whatsapp'

export async function Footer() {
  const { business: b } = await getSite()
  return (
    <footer className="m-foot">
      <div className="m-wrap">
        <div className="m-foot-g">
          <div>
            <Image src="/img/logo-white.webp" alt="Lavigo" width={288} height={105} style={{ height: 30, width: 'auto', marginBottom: 12 }} />
            <p>{BUSINESS.tagline}</p>
            <p style={{ marginTop: 10 }}>{b.address}</p>
            {b.gstin && <p style={{ marginTop: 6 }}>GSTIN {b.gstin}</p>}
          </div>
          <div>
            <h4>Trips</h4>
            <Link href="/trips">Group trips</Link>
            <Link href="/plan">Custom trip planner</Link>
            <Link href="/#destinations">Destinations</Link>
            <Link href="/#moments">Trip vlogs</Link>
          </div>
          <div>
            <h4>Help</h4>
            <Link href="/my-bookings">My bookings</Link>
            <Link href="/refund-policy">Cancellation &amp; refunds</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
          <div>
            <h4>Contact</h4>
            <a href={`tel:${BUSINESS.phoneE164}`}>{BUSINESS.phoneDisplay}</a>
            <a href={waLink()} target="_blank" rel="noopener">WhatsApp</a>
            {b.email && <a href={`mailto:${b.email}`}>{b.email}</a>}
            <a href={b.instagram} target="_blank" rel="noopener">Instagram</a>
          </div>
        </div>
        <div className="m-foot-b">© {new Date().getFullYear()} {BUSINESS.name}, {BUSINESS.city}</div>
      </div>
    </footer>
  )
}
