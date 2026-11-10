export type Activity = { id: string; n: string; p: number; where: string }
export type GalleryImage = { src: string; caption: string }
export type Tier = 'budget' | 'comfort' | 'premium'
export type Hotel = { name: string; place: string; tier: Tier; stars: number; note: string }
export type Car = { name: string; kind: string; seats: number; note: string }
export type Gender = 'male' | 'female'
export type Passenger = { name: string; gender: Gender }
export type TicketBy = 'agency' | 'self'

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
  hotels: Hotel[]
  cars: Car[]
  sort_order: number
  published: boolean
}

// Day-by-day detail. `description`/`highlights`/`meals`/`stay`/`travel` arrive with migration 007;
// trips saved before it only have {title, text, image}, which still renders (text stands in for description).
export type ItineraryDay = {
  title: string
  text?: string  // the old short blurb; trips saved after migration 007 use `description` instead
  image?: string | null
  description?: string
  highlights?: string[]
  meals?: string   // e.g. "B/L/D"
  stay?: string    // hotel or town for the night
  travel?: string  // e.g. "6 h drive, 200 km"
}
export type Faq = { q: string; a: string }
export type TripPlace = { name: string; about: string; image?: string | null }
export type GoodToKnow = { title: string; text: string }

export type Trip = {
  id: string
  slug: string
  destination_id: string | null
  title: string
  route: string
  summary: string
  nights: number
  image: string | null
  gallery?: GalleryImage[]
  itinerary: ItineraryDay[]
  inclusions: string[]
  exclusions: string[]
  faqs: Faq[]
  published: boolean
  // Story content (migration 007). Absent on a database that hasn't run it yet.
  story?: string
  highlights?: string[]
  places?: TripPlace[]
  good_to_know?: GoodToKnow[]
  things_to_carry?: string[]
}

export type Departure = {
  id: string
  trip_id: string
  depart_date: string // YYYY-MM-DD
  price: number // per person incl. GST
  seats_total: number
  seats_left: number
  status: 'open' | 'closed'
  start_city: string
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
  passengers?: Passenger[]
  ticket_by?: TicketBy
  from_city?: string | null
  source?: 'website' | 'admin'
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

export type PayMethod = 'upi' | 'cash' | 'bank' | 'card' | 'other'
export type Payment = { id: string; booking_id: string; amount: number; method: PayMethod; note: string | null; created_at: string }
