// Photos and videos used by the public pages that are not managed from the admin panel.
// Videos live in /public/video (H.264 .mp4, 720p for reels, kept under ~6 MB each)
// with a .webp poster frame next to each one. Edit labels and captions freely.
// The home hero itself has no video or photo: see components/HeroLogoIntro.tsx.

export type Reel = { poster: string; label: string; video?: string }
export type Photo = { src: string; caption: string; wide?: boolean }

// "Trip moments" on the home page: vertical 9:16 clips. Hover previews them; click plays with sound.
export const REELS: Reel[] = [
  { video: '/video/sky-swing.mp4', poster: '/video/sky-swing.webp', label: 'The sky swing' },
  { video: '/video/cable-car.mp4', poster: '/video/cable-car.webp', label: 'Manakamana cable car' },
  { video: '/video/prayer-wheels.mp4', poster: '/video/prayer-wheels.webp', label: 'Spinning the prayer wheels' },
  { video: '/video/cave.mp4', poster: '/video/cave.webp', label: 'Inside Gupteshwor Cave' },
  { video: '/video/old-city.mp4', poster: '/video/old-city.webp', label: 'Temples of the old city' },
  { video: '/video/prayer-flags.mp4', poster: '/video/prayer-flags.webp', label: 'The road of prayer flags' },
  { video: '/video/hill-walk.mp4', poster: '/video/hill-walk.webp', label: 'Morning on the hilltop' },
  { video: '/video/viewpoint.mp4', poster: '/video/viewpoint.webp', label: 'Valley views, Pokhara' },
]

// "From our last trip" photo wall on the home page.
export const TRIP_PHOTOS: Photo[] = [
  { src: '/img/trips/nepal/phewa-group.webp', caption: 'Lavigo group at Phewa Lake, Pokhara', wide: true },
  { src: '/img/trips/nepal/manakamana-1.webp', caption: 'Manakamana temple' },
  { src: '/img/trips/nepal/sky-swing.webp', caption: 'The sky swing' },
  { src: '/img/trips/nepal/phewa-boating.webp', caption: 'Boating on Phewa Lake' },
  { src: '/img/trips/nepal/hill-view.webp', caption: 'Morning view over the hills' },
  { src: '/img/trips/nepal/garden-group.webp', caption: 'The group in Nepal', wide: true },
  { src: '/img/trips/nepal/manakamana-2.webp', caption: 'Manakamana temple courtyard' },
  { src: '/img/trips/nepal/ganesh.webp', caption: 'At the Ganesh shrine' },
  { src: '/img/trips/nepal/statue.webp', caption: 'A roadside shrine on the way' },
  { src: '/img/trips/nepal/hetauda-group.webp', caption: 'Lunch stop in Hetauda' },
]

// Image for the custom-trip band and the about card on the home page.
export const PLAN_IMAGE = '/img/goa-3.webp'
export const ABOUT_IMAGE = '/img/trips/nepal/phewa-group.webp'
