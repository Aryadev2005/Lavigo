import { ADVANCE, CHILD_FACTOR, GST, SERVICE_PER_PERSON } from './config'
import { addDays } from './format'
import { carsFor } from './stays'
import type { Car, Destination, Hotel, TicketBy, Tier } from './types'

export type { Tier }
export type Travel = 'train' | 'flight'
export type Ground = 'shared' | 'private'

export const TIERS: Record<Tier, { name: string; desc: string; meal: number }> = {
  budget: { name: 'Budget', desc: 'Clean, well-reviewed stays', meal: 350 },
  comfort: { name: 'Comfort', desc: '3-star, best locations', meal: 550 },
  premium: { name: 'Premium', desc: 'Resorts and view rooms', meal: 900 },
}
export const TICKETS: Record<TicketBy, { name: string; desc: string }> = {
  agency: { name: 'Lavigo books them', desc: 'Train or flight from your city, booked by us' },
  self: { name: "I'll book my own", desc: 'You reach the destination, we take over from there' },
}
export const TRAVEL: Record<Travel, { name: string; desc: string }> = {
  train: { name: 'Train', desc: 'Sleeper, 3AC or 2AC' },
  flight: { name: 'Flight', desc: 'Economy, nearest airport' },
}
export const GROUND: Record<Ground, { name: string; desc: string }> = {
  shared: { name: 'Shared transfers', desc: 'Station pick-up and sightseeing in shared vehicles' },
  private: { name: 'Private car', desc: 'Your own car and driver every day' },
}

export type Builder = {
  dests: Record<string, number> // slug -> nights
  order: string[]
  start: string // YYYY-MM-DD
  from: string // starting city, any city in India
  adults: number
  kids: number
  tier: Tier
  tickets: TicketBy
  travel: Travel
  ground: Ground
  acts: string[]
}

export const DEFAULT_BUILDER: Omit<Builder, 'dests' | 'order' | 'start' | 'acts'> = {
  from: '', adults: 2, kids: 0, tier: 'comfort', tickets: 'agency', travel: 'train', ground: 'shared',
}

export type Quote = ReturnType<typeof quote>

const CAR_PER_DAY = 3200
const SHARED_PER_STOP = 700
const HOP = 900 // moving between two destinations, per person

export function quote(b: Builder, all: Destination[]) {
  const bySlug = new Map(all.map((d) => [d.slug, d]))
  const order = b.order.filter((k) => b.dests[k] && bySlug.has(k))
  const pax = b.adults + b.kids
  const paxEq = b.adults + b.kids * CHILD_FACTOR
  const rooms = Math.max(1, Math.ceil(b.adults / 2))
  const tier = TIERS[b.tier]
  const from = b.from.trim()
  const rate = (d: Destination) => d[`rate_${b.tier}` as const]

  let nights = 0, stays = 0, meals = 0, acts = 0
  const chosen: { id: string; n: string; p: number; where: string; dest: string }[] = []
  const hotels: (Hotel & { dest: string })[] = []
  for (const k of order) {
    const D = bySlug.get(k)!
    const n = b.dests[k]
    nights += n
    stays += rate(D) * n * rooms
    meals += tier.meal * n * paxEq
    for (const a of D.activities) if (b.acts.includes(a.id)) { acts += a.p * paxEq; chosen.push({ ...a, dest: k }) }
    for (const h of D.hotels ?? []) if (h.tier === b.tier) hotels.push({ ...h, dest: D.name })
  }

  const totalDays = nights + 1
  const first = order.length ? bySlug.get(order[0])! : null
  const tickets = b.tickets === 'agency' && first ? (b.travel === 'flight' ? first.travel_flight : first.travel_train) * paxEq : 0
  const hops = Math.max(0, order.length - 1) * HOP * paxEq
  const carCount = Math.max(1, Math.ceil(pax / 6))
  const ground = !order.length ? 0 : b.ground === 'private' ? CAR_PER_DAY * totalDays * carCount : SHARED_PER_STOP * paxEq * order.length
  const service = SERVICE_PER_PERSON * b.adults + SERVICE_PER_PERSON * 0.5 * b.kids
  const sub = stays + meals + tickets + hops + ground + acts + service
  const total = sub * (1 + GST)

  // cars that suit the group, across the chosen places (no duplicates)
  const seen = new Set<string>()
  const allCars: Car[] = order.flatMap((k) => bySlug.get(k)!.cars ?? []).filter((c) => (seen.has(c.name) ? false : (seen.add(c.name), true)))
  const cars = carsFor(allCars, pax)

  // what the price covers (shown instead of a money breakdown)
  const how = TRAVEL[b.travel].name.toLowerCase()
  const included: string[] = []
  const excluded: string[] = []
  if (order.length) {
    included.push(`${tier.name} hotel stays, ${nights} night${nights > 1 ? 's' : ''} (${rooms} room${rooms > 1 ? 's' : ''})`)
    included.push('Breakfast and dinner every day')
    if (b.tickets === 'agency') included.push(`Return ${how} tickets${from ? ` from ${from}` : ' from your city'}`)
    else excluded.push(`Train or flight tickets${from ? ` from ${from}` : ''} (you book them)`)
    included.push(b.ground === 'private' ? `Private ${cars[0]?.name ?? 'car'} with driver, ${totalDays} days` : 'Station or airport pick-up and drop, shared sightseeing transfers')
    if (order.length > 1) included.push('Transfers between ' + order.map((k) => bySlug.get(k)!.name).join(', '))
    for (const a of chosen) included.push(a.n)
    included.push('Trip planning and help on WhatsApp throughout')
    included.push(`All taxes (${GST * 100}% GST)`)
    excluded.push('Lunch, snacks and drinks', 'Entry tickets and activities not listed above', 'Personal shopping, tips and laundry')
  }

  // day-by-day plan
  const days: { n: number; date: Date; title: string; text: string }[] = []
  let di = 0
  const home = from || 'Your city'
  order.forEach((k, i) => {
    const D = bySlug.get(k)!
    const n = b.dests[k]
    const myActs = chosen.filter((a) => a.dest === k)
    const places = D.places.length ? D.places : [D.name]
    for (let j = 0; j < n; j++) {
      let title: string, text: string
      if (j === 0) {
        title = (i === 0 ? `${home} → ` : bySlug.get(order[i - 1])!.name + ' → ') + places[0]
        text = i > 0
          ? 'Transfer day with stops on the way. Check in and rest.'
          : b.tickets === 'agency'
            ? `Travel from ${from || 'your city'} by ${how}. We pick you up and take you to your ${tier.name.toLowerCase()} stay.`
            : `Reach ${places[0]} on your own. We pick you up at the station or airport and take you to your ${tier.name.toLowerCase()} stay.`
      } else {
        const pi = Math.min(places.length - 1, Math.floor((j * places.length) / n))
        const pp = Math.min(places.length - 1, Math.floor(((j - 1) * places.length) / n))
        if (pi !== pp) { title = `${places[pp]} → ${places[pi]}`; text = `Scenic drive to ${places[pi]}, check in and explore.` }
        else { title = `${places[pi]} sightseeing`; text = 'Local sightseeing at your pace.' }
      }
      const a = myActs.filter((_, ix) => ix % n === j)
      if (a.length) text += ' Includes: ' + a.map((x) => x.n).join(', ') + '.'
      days.push({ n: ++di, date: addDays(b.start, di - 1), title, text })
    }
  })
  if (order.length) {
    const last = bySlug.get(order[order.length - 1])!
    const lp = last.places.length ? last.places : [last.name]
    days.push({ n: ++di, date: addDays(b.start, di - 1), title: `${lp[lp.length - 1]} → ${home}`, text: b.tickets === 'agency' ? 'Check out after breakfast and travel home.' : 'Check out after breakfast. We drop you at the station or airport.' })
  }

  return { order, pax, nights, rooms, days, total, perPerson: pax ? total / pax : 0, advance: total * ADVANCE, chosen, included, excluded, hotels, cars, carCount }
}

/* ---------- share a plan in a link (used by the downloadable itinerary) ---------- */
export function encodePlan(b: Builder) {
  const compact = [b.order.map((k) => `${k}:${b.dests[k]}`).join(','), b.start, b.from, b.adults, b.kids, b.tier, b.tickets, b.travel, b.ground, b.acts.join(',')]
  return compact.map((x) => encodeURIComponent(String(x))).join('~')
}

export function decodePlan(s: string): Builder | null {
  try {
    const [d, start, from, adults, kids, tier, tickets, travel, ground, acts] = s.split('~').map((x) => decodeURIComponent(x))
    const order: string[] = []
    const dests: Record<string, number> = {}
    for (const part of (d || '').split(',').filter(Boolean)) {
      const [k, n] = part.split(':')
      const nn = Math.round(Number(n))
      if (/^[a-z0-9-]{1,60}$/.test(k) && nn >= 1 && nn <= 30) { order.push(k); dests[k] = nn }
    }
    if (!order.length || !/^\d{4}-\d{2}-\d{2}$/.test(start)) return null
    const int = (v: string, lo: number, hi: number, dflt: number) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : dflt }
    return {
      dests, order, start,
      from: (from || '').slice(0, 60),
      adults: int(adults, 1, 20, 2),
      kids: int(kids, 0, 20, 0),
      tier: (['budget', 'comfort', 'premium'] as const).find((t) => t === tier) ?? 'comfort',
      tickets: tickets === 'self' ? 'self' : 'agency',
      travel: travel === 'flight' ? 'flight' : 'train',
      ground: ground === 'private' ? 'private' : 'shared',
      acts: (acts || '').split(',').filter((a) => /^[a-z0-9-]{1,40}$/.test(a)).slice(0, 40),
    }
  } catch {
    return null
  }
}
