'use client'
import { useRouter } from 'next/navigation'

/** A table row that opens a page when clicked (links inside still work on their own). */
export function ClickRow({ href, children }: { href: string; children: React.ReactNode }) {
  const router = useRouter()
  return (
    <tr className="link" onClick={(e) => { if (!(e.target as HTMLElement).closest('a,button,input,select,textarea,label')) router.push(href) }}>
      {children}
    </tr>
  )
}
