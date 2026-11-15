'use client'
import { usePathname } from 'next/navigation'
/** Pages that draw their own full-screen layout: no site header, footer or WhatsApp button. */
export const noChrome = (p: string) => p.startsWith('/admin') || p.endsWith('/itinerary') || p === '/login' || p === '/verify-phone'

export function FooterGate({ children }: { children: React.ReactNode }) {
  const p = usePathname()
  return noChrome(p) ? null : <>{children}</>
}
