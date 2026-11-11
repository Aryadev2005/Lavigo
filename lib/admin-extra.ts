import 'server-only'
import type { Post } from './content'
import { adminClient } from './supabase'

// Admin reads for the tables added in migration 008. Each returns `null` when the table is not
// there yet, so pages can say "run the database update" instead of crashing.
const missing = (e: { code?: string; message?: string } | null) =>
  Boolean(e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|could not find the table/i.test(e.message || '')))

export type AdminReview = { id: string; name: string; city: string; rating: number; title: string; body: string; status: 'pending' | 'approved' | 'hidden'; reply: string; created_at: string; user_id: string | null; booking_id: string | null; trip: { title: string; slug: string } | null }
export type Enquiry = { id: string; kind: 'custom' | 'question' | 'trip'; name: string; phone: string; email: string | null; message: string; details: Record<string, string>; status: 'new' | 'replied' | 'closed'; admin_note: string; created_at: string; trip: { title: string; slug: string } | null }
export type CustomerRow = { id: string; email: string | null; full_name: string; phone: string; created_at: string; bookings: number; spent: number; last: string | null }

export async function listReviewsAdmin(status?: string): Promise<AdminReview[] | null> {
  let q = adminClient().from('reviews').select('*, trip:trips(title,slug)').order('created_at', { ascending: false }).limit(300)
  if (status && status !== 'all') q = q.eq('status', status)
  const { data, error } = await q
  if (missing(error)) return null
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as AdminReview[]
}

export async function listEnquiries(status?: string): Promise<Enquiry[] | null> {
  let q = adminClient().from('enquiries').select('*, trip:trips(title,slug)').order('created_at', { ascending: false }).limit(300)
  if (status && status !== 'all') q = q.eq('status', status)
  const { data, error } = await q
  if (missing(error)) return null
  if (error) throw new Error(error.message)
  return (data ?? []) as unknown as Enquiry[]
}

export async function listPostsAdmin(): Promise<Post[] | null> {
  const { data, error } = await adminClient().from('posts').select('*').order('created_at', { ascending: false })
  if (missing(error)) return null
  if (error) throw new Error(error.message)
  return (data ?? []) as Post[]
}
export async function getPostAdmin(id: string): Promise<Post | null> {
  const { data, error } = await adminClient().from('posts').select('*').eq('id', id).maybeSingle()
  if (error) return null
  return data as Post | null
}

export async function listCustomers(): Promise<CustomerRow[] | null> {
  const sb = adminClient()
  const { data, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000)
  if (missing(error)) return null
  if (error) throw new Error(error.message)
  const ids = (data ?? []).map((p) => p.id as string)
  const stats = new Map<string, { n: number; spent: number; last: string | null }>()
  if (ids.length) {
    const { data: bk } = await sb.from('bookings').select('user_id,status,amount_paid,created_at').in('user_id', ids)
    for (const b of bk ?? []) {
      const s = stats.get(b.user_id as string) ?? { n: 0, spent: 0, last: null }
      s.n++
      s.spent += Number(b.amount_paid || 0)
      if (!s.last || (b.created_at as string) > s.last) s.last = b.created_at as string
      stats.set(b.user_id as string, s)
    }
  }
  return (data ?? []).map((p) => {
    const s = stats.get(p.id as string)
    return { id: p.id, email: p.email, full_name: p.full_name, phone: p.phone, created_at: p.created_at, bookings: s?.n ?? 0, spent: s?.spent ?? 0, last: s?.last ?? null }
  })
}

/** Badges for the sidebar: reviews waiting for approval and new enquiries. Zero before migration 008. */
export async function inboxCounts() {
  const sb = adminClient()
  const [r, e] = await Promise.all([
    sb.from('reviews').select('id', { count: 'exact' }).eq('status', 'pending').limit(1),
    sb.from('enquiries').select('id', { count: 'exact' }).eq('status', 'new').limit(1),
  ])
  return { reviews: r.error ? 0 : r.count ?? 0, enquiries: e.error ? 0 : e.count ?? 0 }
}
