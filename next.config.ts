import type { NextConfig } from 'next'

// hostname of the Supabase project (tolerates a pasted "/rest/v1/" suffix, quotes, etc.)
let supabaseHost: string | undefined
try { supabaseHost = new URL((process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']+|["']+$/g, '')).hostname } catch { /* not set yet */ }

const config: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // Photos uploaded from the admin panel live in Supabase Storage
    remotePatterns: supabaseHost ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] : [],
  },
  poweredByHeader: false,
  // photo uploads from /admin (browser downsizes to ~1600px first; Vercel's hard cap is 4.5 MB)
  experimental: { serverActions: { bodySizeLimit: '4mb' } },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      ],
    }]
  },
}
export default config
