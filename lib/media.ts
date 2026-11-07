// Photos and videos used by the public pages that are not managed from the admin panel.
// To add a video: put a compressed .mp4 (H.264, ideally under 8 MB) in /public/video/
// and set its path below, e.g. video: '/video/nepal-stupa.mp4'. Posters stay as photos.

export type Reel = { poster: string; label: string; video?: string }

// Background video for the home hero. Leave null to use HERO_IMAGE.
export const HERO_VIDEO: string | null = null
export const HERO_IMAGE = '/img/hero-sikkim-bg.webp'

// "Trip moments" row on the home page (vertical 9:16 clips work best).
export const REELS: Reel[] = [
  { poster: '/img/nepal-4.webp', label: 'Stupa below the Annapurnas' },
  { poster: '/img/darjeeling-2.webp', label: 'Darjeeling ropeway' },
  { poster: '/img/sikkim-4.webp', label: 'First snow, North Sikkim' },
  { poster: '/img/darjeeling-8.webp', label: 'Peace Pagoda in the clouds' },
  { poster: '/img/nepal-6.webp', label: 'Prayer wheels, Nepal' },
]

// Image for the custom-trip band and the about card on the home page.
export const PLAN_IMAGE = '/img/goa-3.webp'
export const ABOUT_IMAGE = '/img/nepal-1.webp'
