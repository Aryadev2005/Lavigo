'use client'
import { usePathname } from 'next/navigation'
export function FooterGate({ children }: { children: React.ReactNode }) {
  const p = usePathname()
  return p.startsWith('/admin') || p.endsWith('/itinerary') ? null : <>{children}</>
}
