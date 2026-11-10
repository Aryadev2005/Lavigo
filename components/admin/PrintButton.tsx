'use client'
import { Icon } from '@/components/Icons'

export function PrintButton({ label = 'Print' }: { label?: string }) {
  return <button type="button" className="btn b-ghost" onClick={() => window.print()}><Icon name="print" size={16} />{label}</button>
}
