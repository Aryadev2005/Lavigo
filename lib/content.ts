import 'server-only'
import { cache } from 'react'
import { dbConfigured, publicClient } from './supabase'

export type Review = { id: string; name: string; city: string; rating: number; title: string; body: string; reply: string; created_at: string; trip_id: string | null; trip?: { title: string; slug: string } | null }
export type MediaItem = { type: 'photo' | 'video'; src: string; poster?: string; caption: string }
export type Post = {
  id: string; slug: string; title: string; excerpt: string; cover: string | null; body: string
  media: MediaItem[]; place: string; trip_id: string | null; published: boolean; published_at: string | null; created_at: string
}

/** Approved reviews, newest first. Empty before migration 008 (never throws). */
export const getReviews = cache(async (limit = 60, tripId?: string): Promise<Review[]> => {
  if (!dbConfigured) return []
  try {
    let q = publicClient().from('reviews').select('id,name,city,rating,title,body,reply,created_at,trip_id,trip:trips(title,slug)').eq('status', 'approved')
    if (tripId) q = q.eq('trip_id', tripId)
    const { data, error } = await q.order('created_at', { ascending: false }).limit(limit)
    return error ? [] : ((data ?? []) as unknown as Review[])
  } catch { return [] }
})

export function reviewStats(list: Review[]) {
  if (!list.length) return null
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length
  return { avg: Math.round(avg * 10) / 10, count: list.length }
}

/** Published blog posts, newest first. Empty before migration 008. */
export const getPosts = cache(async (): Promise<Post[]> => {
  if (!dbConfigured) return []
  try {
    const { data, error } = await publicClient().from('posts').select('*').eq('published', true).order('published_at', { ascending: false }).order('created_at', { ascending: false })
    return error ? [] : ((data ?? []) as Post[])
  } catch { return [] }
})

export const getPost = cache(async (slug: string): Promise<Post | null> => {
  if (!dbConfigured) return null
  try {
    const { data, error } = await publicClient().from('posts').select('*').eq('slug', slug).eq('published', true).maybeSingle()
    return error ? null : (data as Post | null)
  } catch { return null }
})

/** Blog body: paragraphs split by blank lines, "## " lines become headings, "> " lines become pull quotes. */
export function blocks(body: string): { kind: 'p' | 'h' | 'q'; text: string }[] {
  return body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) =>
    b.startsWith('## ') ? { kind: 'h' as const, text: b.slice(3).trim() }
      : b.startsWith('> ') ? { kind: 'q' as const, text: b.replace(/^>\s?/gm, '').trim() }
      : { kind: 'p' as const, text: b })
}

export const readMinutes = (p: Post) => Math.max(1, Math.round((p.body.split(/\s+/).length + p.media.length * 20) / 200))
