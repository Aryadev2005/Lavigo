// Small display pieces shared by the admin pages (server components).
import Link from 'next/link'
import { Icon, type IconName } from '@/components/Icons'
import { fmtDate, inr } from '@/lib/format'
import type { GenderCount } from '@/lib/admin-data'
import type { Booking } from '@/lib/types'

export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (err) return <div className="ad-flash err" role="alert"><Icon name="alert" size={18} />{err}</div>
  if (ok) return <div className="ad-flash ok" role="status"><Icon name="check" size={18} />{ok}</div>
  return null
}

export function Head({ title, sub, back, children }: { title: React.ReactNode; sub?: React.ReactNode; back?: { href: string; label: string }; children?: React.ReactNode }) {
  return (
    <div className="ad-head">
      <div>
        {back && <Link href={back.href} className="ad-crumb">← {back.label}</Link>}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="ad-acts">{children}</div>}
    </div>
  )
}

export function Stat({ icon, label, value, note, hot }: { icon: IconName; label: string; value: React.ReactNode; note?: React.ReactNode; hot?: boolean }) {
  return (
    <div className={'card ad-stat' + (hot ? ' hot' : '')}>
      <small><Icon name={icon} size={16} />{label}</small>
      <b>{value}</b>
      {note && <span>{note}</span>}
    </div>
  )
}

const STATUS_LABEL: Record<string, string> = { held: 'On hold', confirmed: 'Confirmed', cancelled: 'Cancelled', expired: 'Hold lapsed' }
export function StatusPill({ b }: { b: Pick<Booking, 'status' | 'hold_expires_at'> }) {
  const lapsed = b.status === 'held' && (!b.hold_expires_at || new Date(b.hold_expires_at).getTime() <= Date.now())
  const s = lapsed ? 'expired' : b.status
  return <span className={'pill ' + s}>{STATUS_LABEL[s]}</span>
}
const PAY_LABEL: Record<string, string> = { unpaid: 'Unpaid', partial: 'Part paid', paid: 'Paid in full', refunded: 'Refunded' }
export function PayPill({ b }: { b: Pick<Booking, 'status' | 'amount_paid' | 'amount_total' | 'payment_status'> }) {
  const s = b.payment_status ?? (b.amount_paid >= b.amount_total && b.amount_total > 0 ? 'paid' : b.amount_paid > 0 ? 'partial' : 'unpaid')
  return <span className={'pill ' + s}>{PAY_LABEL[s]}</span>
}

export function GenderBar({ g, total }: { g: GenderCount; total?: number }) {
  return (
    <span className="ad-gbar" title={`${g.male} male, ${g.female} female${g.unknown ? `, ${g.unknown} not given` : ''}`}>
      <span className="m"><span className="dot" />{g.male} M</span>
      <span className="f"><span className="dot" />{g.female} F</span>
      {g.unknown > 0 && <span className="u"><span className="dot" />{g.unknown} ?</span>}
      {total !== undefined && <span className="muted" style={{ fontWeight: 500 }}>· {total} total</span>}
    </span>
  )
}

export function SeatMeter({ total, confirmed, held }: { total: number; confirmed: number; held: number }) {
  const pc = (n: number) => (total ? Math.min(100, (n / total) * 100) : 0)
  const left = Math.max(0, total - confirmed - held)
  return (
    <div>
      <div className="ad-meter" role="img" aria-label={`${confirmed} confirmed, ${held} on hold, ${left} left of ${total}`}>
        <i className="c" style={{ width: pc(confirmed) + '%' }} />
        <i className="h" style={{ width: pc(held) + '%' }} />
      </div>
      <div className="ad-meter-l"><span><b>{confirmed}</b> confirmed{held ? <> · <b>{held}</b> on hold</> : null}</span><span><b>{left}</b> of {total} left</span></div>
    </div>
  )
}

export const money = inr
export const dShort = (d: string) => fmtDate(d, { day: 'numeric', month: 'short', year: 'numeric' })
export const dDay = (d: string) => fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
export function when(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
}
/** "in 5 h", "in 2 days", "3 h ago" */
export function rel(iso: string) {
  const ms = new Date(iso).getTime() - Date.now()
  const a = Math.abs(ms), h = a / 3600e3, d = h / 24
  const s = a < 3600e3 ? `${Math.max(1, Math.round(a / 60e3))} min` : h < 36 ? `${Math.round(h)} h` : `${Math.round(d)} days`
  return ms >= 0 ? `in ${s}` : `${s} ago`
}
/** WhatsApp chat with the customer (Indian numbers stored as 10 digits). */
export const waTo = (phone: string, text?: string) => `https://wa.me/91${phone}${text ? `?text=${encodeURIComponent(text)}` : ''}`
