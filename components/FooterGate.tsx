'use client'
import { usePathname } from 'next/navigation'
export function FooterGate({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith('/admin') ? null : <>{children}</>
}
