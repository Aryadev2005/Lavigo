'use client'
import { usePathname } from 'next/navigation'
import { waLink } from '@/lib/whatsapp'
import { WhatsAppGlyph } from './Icons'

/** Floating "Ask on WhatsApp" button on every public page: goes straight to the owner. */
export function WhatsAppFab() {
  const path = usePathname()
  if (path.startsWith('/admin') || path.endsWith('/itinerary')) return null
  const where = path.startsWith('/trips/') ? ` about ${path.split('/')[2].replace(/-/g, ' ')}` : ''
  return (
    <a className="wa-fab" href={waLink(`Hi Lavigo, I have a question${where}.`)} target="_blank" rel="noopener" aria-label="Ask Lavigo on WhatsApp">
      <WhatsAppGlyph size={24} />
      <span>Ask us</span>
    </a>
  )
}
