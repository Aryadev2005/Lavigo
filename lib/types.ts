export type Activity = { id: string; n: string; p: number; where: string }
export type GalleryImage = { src: string; caption: string }

export type Destination = {
  id: string
  slug: string
  name: string
  area: string
  blurb: string
  hero_image: string | null
  gallery: GalleryImage[]
  default_nights: number
  theme: [string, string, string]
  places: string[]
  rate_budget: number
  rate_comfort: number
  rate_premium: number
  travel_train: number
  travel_cab: number
  travel_flight: number
  activities: Activity[]
  sort_order: number
  published: boolean
}

export type ItineraryDay = { title: string; text: string }
export type Faq = { q: string; a: string }

export type Trip = {
  id: string
  slug: string
  destination_id: string | null
  title: string
  route: string
  summary: string
  nights: number
  image: string | null
  itinerary: ItineraryDay[]
  inclusions: string[]
  exclusions: string[]
  faqs: Faq[]
  published: boolean
}

export type Departure = {
  id: string
  trip_id: string
  depart_date: string // YYYY-MM-DD
  price: number // per person incl. GST
  seats_total: number
  seats_left: number
  status: 'open' | 'closed'
}

export type TripWithDepartures = Trip & {
  destination: Pick<Destination, 'slug' | 'name' | 'theme'> | null
  departures: Departure[]
}

export type BookingStatus = 'held' | 'confirmed' | 'cancelled' | 'expired'

export type Booking = {
  id: string
  code: string
  departure_id: string
  name: string
  phone: string
  email: string | null
  travellers: number
  other_names: string | null
  status: BookingStatus
  hold_expires_at: string | null
  amount_total: number
  amount_advance: number
  amount_paid: number
  payment_provider: string | null
  payment_order_id: string | null
  payment_id: string | null
  payment_status: 'unpaid' | 'partial' | 'paid' | 'refunded'
  admin_note: string | null
  created_at: string
  confirmed_at: string | null
  cancelled_at: string | null
}
