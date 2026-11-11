// Business details used across the site. Edit here (or move to a settings table later).
export const BUSINESS = {
  name: 'Lavigo Travel Co.',
  legalName: 'Lavigo Travel Co.',
  tagline: 'Group trips and custom holidays from anywhere in India.',
  address: 'Ground Floor, Amit Complex, Near Oxford Public School, Chutia, Samlong, Ranchi, Jharkhand',
  city: 'Ranchi',
  region: 'Jharkhand',
  country: 'IN',
  phoneDisplay: '+91 76340 15133',
  phoneE164: '+917634015133',
  whatsapp: '917634015133',
  instagram: 'https://www.instagram.com/lavigo.in/',
  email: '', // TODO: owner's email for contact/policies
  gstin: '', // TODO: owner's GSTIN
} as const

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lavigo.in').replace(/\/$/, '')

// Pricing rules (match the prototype)
export const GST = 0.05
export const ADVANCE = 0.25
export const SERVICE_PER_PERSON = 1500
export const CHILD_FACTOR = 0.6
export const HOLD_HOURS = 24
// Travellers aged CHILD_MAX_AGE or younger on the day the trip starts are children and pay CHILD_FACTOR
// of the adult price on group departures. Every booking needs at least one adult.
export const CHILD_MAX_AGE = 11
