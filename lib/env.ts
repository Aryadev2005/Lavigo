// Tolerant reading of the Supabase env vars. People often paste the URL with a trailing slash,
// a "/rest/v1/" suffix (the "Data API" URL) or surrounding quotes; any of those breaks every query
// with "Invalid path specified in request URL". We keep only the origin, and trim keys.
const unquote = (v: string) => v.trim().replace(/^["']+|["']+$/g, '').trim()

function origin(v?: string) {
  if (!v) return undefined
  try { return new URL(unquote(v)).origin } catch { return undefined }
}
const key = (v?: string) => (v ? unquote(v) || undefined : undefined)

export const SUPABASE_URL = origin(process.env.NEXT_PUBLIC_SUPABASE_URL)
export const SUPABASE_ANON = key(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
export const SUPABASE_SERVICE = key(process.env.SUPABASE_SERVICE_ROLE_KEY)
