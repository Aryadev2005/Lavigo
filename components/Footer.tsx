import Image from 'next/image'
import Link from 'next/link'
import { BUSINESS } from '@/lib/config'
import { waLink } from '@/lib/whatsapp'

export function Footer() {
  return (
    <footer>
      <div className="wrap fg">
        <div>
          <Image src="/img/logo.webp" alt="Lavigo" width={288} height={105} style={{ height: 28, width: 'auto', marginBottom: 10 }} />
          <p>{BUSINESS.tagline}<br />{BUSINESS.address}</p>
        </div>
        <div>
          <h4>Travel</h4>
          <Link href="/trips">Group trips</Link>
          <Link href="/plan">Plan a custom trip</Link>
          <Link href="/my-bookings">My bookings</Link>
        </div>
        <div>
          <h4>Talk to us</h4>
          <a href={`tel:${BUSINESS.phoneE164}`}>{BUSINESS.phoneDisplay}</a>
          <a href={waLink()} target="_blank" rel="noopener">WhatsApp</a>
          <a href={BUSINESS.instagram} target="_blank" rel="noopener">Instagram @lavigo.in</a>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refund-policy">Cancellation &amp; refunds</Link>
        </div>
      </div>
    </footer>
  )
}
