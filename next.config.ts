import type { NextConfig } from 'next'

// hostname of the Supabase project (tolerates a pasted "/rest/v1/" suffix, quotes, etc.)
let supabaseHost: string | undefined
let supabaseProto: 'https' | 'http' = 'https'
try {
  const u = new URL((process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^["']+|["']+$/g, ''))
  supabaseHost = u.hostname
  if (u.protocol === 'http:') supabaseProto = 'http' // local development only
} catch { /* not set yet */ }

const config: NextConfig = {
  images: {
    formats: ['image/webp'],
    // sensible size ladder (the default goes up to 3840px, and every size is generated on first request)
    deviceSizes: [480, 768, 1080, 1440],
    imageSizes: [96, 200, 360, 640],
    qualities: [70],
    minimumCacheTTL: 31536000, // photos rarely change; cache optimised copies for a year
    // Photos uploaded from the admin panel live in Supabase Storage
    remotePatterns: supabaseHost ? [{ protocol: supabaseProto, hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }] : [],
    // only when Supabase itself runs on this machine (local testing); never true for the hosted project
    dangerouslyAllowLocalIP: supabaseHost === 'localhost' || supabaseHost === '127.0.0.1',
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
